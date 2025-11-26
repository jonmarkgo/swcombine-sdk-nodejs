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

export interface HttpClientOptions {
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  debug?: boolean;
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

  constructor(options: HttpClientOptions, tokenManager?: TokenManager) {
    this.tokenManager = tokenManager;
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelay = options.retryDelay ?? 1000;
    this.debug = options.debug ?? false;

    // Create axios instance
    this.axios = axios.create({
      baseURL: options.baseURL ?? 'https://www.swcombine.com/ws/v2.0/',
      timeout: options.timeout ?? 30000,
      headers: {
        'Accept': 'application/json',
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
              // SW Combine API supports two methods for sending access tokens:
              // 1. Authorization header: "Authorization: OAuth TOKEN"
              // 2. Query parameter: "?access_token=TOKEN"
              //
              // This SDK uses query parameters as the primary method based on empirical testing
              // and project documentation (see CLAUDE.md). Both methods are valid per official docs.
              config.params = config.params || {};
              config.params.access_token = token;

              if (this.debug) {
                console.log(`[SWC SDK] Added auth token as query param: ${token.substring(0, 20)}...`);
              }
            } else {
              if (this.debug) {
                console.log(`[SWC SDK] No token available from TokenManager`);
              }
            }
          } catch (error: any) {
            if (this.debug) {
              console.log(`[SWC SDK] Error getting token: ${error.message}`);
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
        // Log rate limit headers if available
        if (response.headers && this.debug) {
          const rateLimitInfo = {
            limit: response.headers['x-ratelimit-limit'],
            remaining: response.headers['x-ratelimit-remaining'],
            reset: response.headers['x-ratelimit-reset'],
            resetTime: response.headers['x-ratelimit-resettime'],
          };

          if (rateLimitInfo.limit) {
            console.log(
              `[SWC SDK] Rate Limit: ${rateLimitInfo.remaining}/${rateLimitInfo.limit} remaining` +
                ` (resets at ${rateLimitInfo.resetTime || new Date(parseInt(rateLimitInfo.reset) * 1000).toISOString()})`
            );
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
        const config = error.config as InternalAxiosRequestConfig & { _retryCount?: number };

        // Handle 401 - attempt token refresh
        if (error.response?.status === 401 && this.tokenManager) {
          try {
            await this.tokenManager.refreshToken();
            // Retry the request with new token
            return this.axios.request(config);
          } catch (refreshError) {
            // Token refresh failed, throw auth error
            throw SWCError.fromHttpResponse(
              401,
              error.response?.data,
              error.response?.headers['x-request-id']
            );
          }
        }

        // Handle retryable errors
        if (this.shouldRetry(error, config._retryCount ?? 0)) {
          config._retryCount = (config._retryCount ?? 0) + 1;

          // Wait before retrying (exponential backoff)
          const delay = this.retryDelay * Math.pow(2, config._retryCount - 1);
          await this.sleep(delay);

          if (this.debug) {
            console.log(
              `[SWC SDK] Retrying request (attempt ${config._retryCount}/${this.maxRetries})`
            );
          }

          return this.axios.request(config);
        }

        // Convert to SWCError
        if (error.response) {
          throw SWCError.fromHttpResponse(
            error.response.status,
            error.response.data,
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
    const responseData = error.response.data as any;

    // Check if HTTP 400 is actually a rate limit error
    const isRateLimitError =
      status === 400 &&
      (responseData?.error === 'rate_limit_exceeded' ||
        responseData?.message?.toLowerCase().includes('rate limit') ||
        responseData?.error_description?.toLowerCase().includes('rate limit'));

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
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.get<T>(url, config);
    return response.data;
  }

  /**
   * Make a POST request
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.post<T>(url, data, config);
    return response.data;
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.put<T>(url, data, config);
    return response.data;
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.delete<T>(url, config);
    return response.data;
  }

  /**
   * Make a custom request
   */
  async request<T = any>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.request<T>(config);
    return response.data;
  }

  /**
   * Set token manager (useful for late initialization)
   */
  setTokenManager(tokenManager: TokenManager): void {
    this.tokenManager = tokenManager;
  }
}
