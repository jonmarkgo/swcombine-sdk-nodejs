/**
 * HTTP client for making requests to SW Combine API
 */

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { SWCError } from './errors.js';
import type { TokenManager } from '../auth/TokenManager.js';
import type { RateLimitInfo } from '../types/index.js';

export interface HttpClientOptions {
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  debug?: boolean;
  /** Callback fired when rate limit info is received from API */
  onRateLimitUpdate?: (info: RateLimitInfo) => void;
}

/**
 * HTTP client that handles requests, retries, and token refresh
 */
export class HttpClient {
  private axios: AxiosInstance;
  private tokenManager?: TokenManager;
  private maxRetries: number;
  private retryDelay: number;
  private debug: boolean;
  private onRateLimitUpdate?: (info: RateLimitInfo) => void;
  private _lastRateLimitInfo: RateLimitInfo | null = null;

  constructor(options: HttpClientOptions, tokenManager?: TokenManager) {
    this.tokenManager = tokenManager;
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelay = options.retryDelay ?? 1000;
    this.debug = options.debug ?? false;
    this.onRateLimitUpdate = options.onRateLimitUpdate;

    // Create axios instance
    this.axios = axios.create({
      baseURL: options.baseURL ?? 'https://www.swcombine.com/ws/v2.0/',
      timeout: options.timeout ?? 30000,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Set up interceptors
    this.setupRequestInterceptor();
    this.setupResponseInterceptor();
  }

  /**
   * Set up request interceptor to add auth token
   */
  private setupRequestInterceptor(): void {
    this.axios.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // Add access token if available
        if (this.tokenManager) {
          try {
            const token = await this.tokenManager.getAccessToken();
            if (token) {
              // Use Authorization header to keep tokens out of URLs, logs, and Referer headers.
              // The SW Combine API supports both "Authorization: OAuth TOKEN" and query params,
              // but headers are the more secure approach.
              config.headers = config.headers || {};
              config.headers['Authorization'] = `OAuth ${token}`;

              if (this.debug) {
                console.log(
                  `[SWC SDK] Added auth token as Authorization header: ${token.substring(0, 8)}...`
                );
              }
            } else {
              if (this.debug) {
                console.log(`[SWC SDK] No token available from TokenManager`);
              }
            }
          } catch (error: unknown) {
            if (this.debug) {
              console.log(
                `[SWC SDK] Error getting token: ${error instanceof Error ? error.message : String(error)}`
              );
            }
            // Don't fail the request, just proceed without token
          }
        }

        if (this.debug) {
          console.log(`[SWC SDK] ${config.method?.toUpperCase()} ${config.url}`);
          console.log(`[SWC SDK] Query params:`, config.params);
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Set up response interceptor to handle errors and retries
   */
  private setupResponseInterceptor(): void {
    this.axios.interceptors.response.use(
      (response) => {
        // Extract and store rate limit headers if available
        if (response.headers) {
          const limit = response.headers['x-ratelimit-limit'];
          const remaining = response.headers['x-ratelimit-remaining'];
          const reset = response.headers['x-ratelimit-reset'];
          const resetTime = response.headers['x-ratelimit-resettime'];

          if (limit) {
            this._lastRateLimitInfo = {
              limit: parseInt(limit, 10),
              remaining: parseInt(remaining, 10),
              reset: parseInt(reset, 10),
              resetTime: resetTime || new Date(parseInt(reset, 10) * 1000).toISOString(),
            };

            // Call the callback if registered
            if (this.onRateLimitUpdate) {
              this.onRateLimitUpdate(this._lastRateLimitInfo);
            }

            if (this.debug) {
              console.log(
                `[SWC SDK] Rate Limit: ${this._lastRateLimitInfo.remaining}/${this._lastRateLimitInfo.limit} remaining` +
                  ` (resets at ${this._lastRateLimitInfo.resetTime})`
              );
            }
          }
        }

        // Extract data from swcapi wrapper if present
        if (response.data && typeof response.data === 'object' && 'swcapi' in response.data) {
          const swcapiData = response.data.swcapi;
          // Get the first key's value (e.g., swcapi.character -> character data)
          const keys = Object.keys(swcapiData);
          if (keys.length === 1) {
            response.data = swcapiData[keys[0]];
          } else {
            // If multiple keys or no keys, return the swcapi object itself
            response.data = swcapiData;
          }
        }
        return response;
      },
      async (error: AxiosError) => {
        const config = error.config as InternalAxiosRequestConfig & {
          _retryCount?: number;
          _hasAttemptedRefresh?: boolean;
        };

        // Handle 401 - attempt token refresh only once per request. Without
        // the _hasAttemptedRefresh guard the retry (line below) would re-enter
        // this interceptor on a second 401, creating an infinite refresh loop
        // for errors that aren't fixable by refreshing (wrong scope, revoked
        // token, etc.).
        if (
          error.response?.status === 401 &&
          this.tokenManager &&
          this.tokenManager.hasRefreshToken() &&
          !config._hasAttemptedRefresh
        ) {
          config._hasAttemptedRefresh = true;
          try {
            await this.tokenManager.refreshToken();
            // Retry the request with new token
            return this.axios.request(config);
          } catch (refreshError) {
            if (SWCError.isSWCError(refreshError)) {
              throw refreshError;
            }
            // Token refresh failed, throw auth error
            throw SWCError.fromHttpResponse(
              401,
              error.response?.data as Record<string, unknown> | undefined,
              error.response?.headers['x-request-id']
            );
          }
        }

        // Handle retryable errors
        if (this.shouldRetry(error, config._retryCount ?? 0)) {
          config._retryCount = (config._retryCount ?? 0) + 1;

          // Calculate delay: use Retry-After header if available, otherwise exponential backoff
          let delay = this.retryDelay * Math.pow(2, config._retryCount - 1);

          // Check for Retry-After header (used for rate limiting)
          const retryAfter = error.response?.headers?.['retry-after'];
          if (retryAfter) {
            // Retry-After can be seconds (number) or HTTP date
            const retryAfterSeconds = parseInt(retryAfter, 10);
            if (!isNaN(retryAfterSeconds)) {
              delay = retryAfterSeconds * 1000; // Convert to milliseconds
            } else {
              // Try parsing as HTTP date
              const retryDate = new Date(retryAfter);
              if (!isNaN(retryDate.getTime())) {
                delay = Math.max(0, retryDate.getTime() - Date.now());
              }
            }
          }

          if (this.debug) {
            console.log(
              `[SWC SDK] Retrying request in ${delay}ms (attempt ${config._retryCount}/${this.maxRetries})` +
                (retryAfter ? ` [Retry-After: ${retryAfter}]` : '')
            );
          }

          await this.sleep(delay);
          return this.axios.request(config);
        }

        // Convert to SWCError
        if (error.response) {
          throw SWCError.fromHttpResponse(
            error.response.status,
            error.response.data as Record<string, unknown> | undefined,
            error.response.headers['x-request-id']
          );
        } else if (error.request) {
          throw SWCError.fromNetworkError(error);
        } else {
          throw new SWCError(error.message, {
            type: 'unknown',
            cause: error,
          });
        }
      }
    );
  }

  /**
   * Determine if a request should be retried
   */
  private shouldRetry(error: AxiosError, retryCount: number): boolean {
    // Don't retry if we've exceeded max retries
    if (retryCount >= this.maxRetries) {
      return false;
    }

    // Network errors are retryable
    if (!error.response) {
      return true;
    }

    const status = error.response.status;
    const responseData = error.response.data as Record<string, unknown> | undefined;

    // Check if HTTP 400 is actually a rate limit error
    const isRateLimitError =
      status === 400 &&
      (responseData?.error === 'rate_limit_exceeded' ||
        (typeof responseData?.message === 'string' &&
          responseData.message.toLowerCase().includes('rate limit')) ||
        (typeof responseData?.error_description === 'string' &&
          responseData.error_description.toLowerCase().includes('rate limit')));

    // Retry rate limit errors (429 or 400 with rate limit content)
    if (status === 429 || isRateLimitError) {
      return true;
    }

    // Don't retry other 4xx errors
    if (status >= 400 && status < 500) {
      return false;
    }

    // Retry 5xx server errors
    if (status >= 500) {
      return true;
    }

    return false;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Make a GET request
   */
  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.get<T>(url, config);
    return response.data;
  }

  /**
   * Make a POST request
   */
  async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.post<T>(url, data, config);
    return response.data;
  }

  /**
   * Make a PUT request
   */
  async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.put<T>(url, data, config);
    return response.data;
  }

  /**
   * Make a DELETE request
   */
  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.delete<T>(url, config);
    return response.data;
  }

  /**
   * Make a custom request
   */
  async request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.request<T>(config);
    return response.data;
  }

  /**
   * Set token manager (useful for late initialization)
   */
  setTokenManager(tokenManager: TokenManager): void {
    this.tokenManager = tokenManager;
  }

  /**
   * Get the last known rate limit information from API response headers.
   * Returns null if no rate limit info has been received yet.
   *
   * @example
   * ```typescript
   * const rateLimits = client.getRateLimitInfo();
   * if (rateLimits) {
   *   console.log(`${rateLimits.remaining}/${rateLimits.limit} requests remaining`);
   *   console.log(`Resets at: ${rateLimits.resetTime}`);
   * }
   * ```
   */
  getRateLimitInfo(): RateLimitInfo | null {
    return this._lastRateLimitInfo;
  }

  /**
   * Set a callback to be notified when rate limit info is updated.
   *
   * @example
   * ```typescript
   * client.setRateLimitCallback((info) => {
   *   if (info.remaining < 100) {
   *     console.warn(`Warning: Only ${info.remaining} API requests remaining!`);
   *   }
   * });
   * ```
   */
  setRateLimitCallback(callback: (info: RateLimitInfo) => void): void {
    this.onRateLimitUpdate = callback;
  }
}
