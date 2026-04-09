/**
 * Main SW Combine SDK client
 */

import { HttpClient } from './http/HttpClient.js';
import { OAuthClient } from './auth/OAuthClient.js';
import { TokenManager } from './auth/TokenManager.js';
import { SWCError } from './http/errors.js';
import {
  ClientConfig,
  OAuthToken,
  OAuthAuthorizationOptions,
  OAuthCallbackQuery,
  AuthorizationResult,
  RateLimitInfo,
} from './types/index.js';

// Import all resource classes
import { ApiResource } from './resources/ApiResource.js';
import { CharacterResource } from './resources/CharacterResource.js';
import { FactionResource } from './resources/FactionResource.js';
import { GalaxyResource } from './resources/GalaxyResource.js';
import { InventoryResource } from './resources/InventoryResource.js';
import { MarketResource } from './resources/MarketResource.js';
import { NewsResource } from './resources/NewsResource.js';
import { TypesResource } from './resources/TypesResource.js';
import { EventsResource } from './resources/EventsResource.js';
import { LocationResource } from './resources/LocationResource.js';
import { DatacardResource } from './resources/DatacardResource.js';

/**
 * Main SW Combine SDK client
 *
 * @see https://www.swcombine.com/ws/v2.0/developers/index.php SW Combine API Documentation
 */
export class SWCombine {
  private config: ClientConfig;
  private http: HttpClient;
  private oauthClient?: OAuthClient;
  private tokenManager: TokenManager;

  // API resources
  public readonly api: ApiResource;
  public readonly character: CharacterResource;
  public readonly faction: FactionResource;
  public readonly galaxy: GalaxyResource;
  public readonly inventory: InventoryResource;
  public readonly market: MarketResource;
  public readonly news: NewsResource;
  public readonly types: TypesResource;
  public readonly events: EventsResource;
  public readonly location: LocationResource;
  public readonly datacard: DatacardResource;

  // Auth property for OAuth operations
  public readonly auth: {
    getAuthorizationUrl: (options: OAuthAuthorizationOptions) => string;
    handleCallback: (query: OAuthCallbackQuery) => Promise<AuthorizationResult>;
    revokeToken: (refreshToken: string) => Promise<void>;
  };

  constructor(config: ClientConfig = {}) {
    this.config = config;
    const hasClientId = !!config.clientId?.trim();
    const hasClientSecret = !!config.clientSecret?.trim();

    if (hasClientId !== hasClientSecret) {
      throw new SWCError('Provide both clientId and clientSecret together, or neither.', {
        type: 'auth',
      });
    }

    // Initialize token manager
    this.tokenManager = new TokenManager(config.token);

    // Initialize OAuth client when full OAuth credentials are provided
    if (hasClientId && hasClientSecret) {
      this.oauthClient = new OAuthClient({
        clientId: config.clientId!,
        clientSecret: config.clientSecret!,
        redirectUri: config.redirectUri,
        accessType: config.accessType,
      });
    }

    // Set up token refresh callback
    this.tokenManager.setRefreshCallback(async () => {
      const oauthClient = this.requireOAuthCredentials('refresh access tokens');
      const refreshToken = this.tokenManager.getRefreshToken();
      if (!refreshToken) {
        throw new SWCError('Cannot refresh access token: no refresh token is available.', {
          type: 'auth',
        });
      }
      return oauthClient.refreshToken(refreshToken);
    });

    // Initialize HTTP client
    this.http = new HttpClient(
      {
        baseURL: config.baseURL,
        timeout: config.timeout,
        maxRetries: config.maxRetries,
        retryDelay: config.retryDelay,
        debug: config.debug,
      },
      this.tokenManager
    );

    // Initialize all resources
    this.api = new ApiResource(this.http);
    this.character = new CharacterResource(this.http);
    this.faction = new FactionResource(this.http);
    this.galaxy = new GalaxyResource(this.http);
    this.inventory = new InventoryResource(this.http);
    this.market = new MarketResource(this.http);
    this.news = new NewsResource(this.http);
    this.types = new TypesResource(this.http);
    this.events = new EventsResource(this.http);
    this.location = new LocationResource(this.http);
    this.datacard = new DatacardResource(this.http);

    // Set up auth operations
    this.auth = {
      getAuthorizationUrl: (options: OAuthAuthorizationOptions) => {
        const oauthClient = this.requireOAuthCredentials('generate an authorization URL');
        return oauthClient.getAuthorizationUrl(options);
      },
      handleCallback: async (query: OAuthCallbackQuery) => {
        const oauthClient = this.requireOAuthCredentials('handle OAuth callbacks');
        const result = await oauthClient.handleCallback(query);
        if (result.success && result.token) {
          this.tokenManager.setToken(result.token);
        }
        return result;
      },
      revokeToken: async (refreshToken: string) => {
        const oauthClient = this.requireOAuthCredentials('revoke tokens');
        return oauthClient.revokeToken(refreshToken);
      },
    };
  }

  /**
   * Set the access token
   */
  setToken(token: string | OAuthToken): void {
    this.tokenManager.setToken(token);
  }

  /**
   * Get the current token
   */
  getToken(): OAuthToken | null {
    return this.tokenManager.getToken();
  }

  /**
   * Clear the token
   */
  clearToken(): void {
    this.tokenManager.clear();
  }

  /**
   * Manually refresh the token
   */
  async refreshToken(): Promise<void> {
    this.requireOAuthCredentials('refresh access tokens');

    if (!this.tokenManager.hasRefreshToken()) {
      throw new SWCError('Cannot refresh access token: no refresh token is available.', {
        type: 'auth',
      });
    }

    await this.tokenManager.refreshToken();
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    return this.tokenManager.isExpired();
  }

  /**
   * Check if refresh token is available
   */
  hasRefreshToken(): boolean {
    return this.tokenManager.hasRefreshToken();
  }

  /**
   * Get the current rate limit information.
   * Returns the last known rate limit info from API response headers.
   * Returns null if no API calls have been made yet.
   *
   * Note: The SW Combine API has a default limit of 600 requests per hour.
   *
   * @example
   * ```typescript
   * const rateLimit = client.getRateLimitInfo();
   * if (rateLimit) {
   *   console.log(`${rateLimit.remaining}/${rateLimit.limit} requests remaining`);
   *   console.log(`Resets at: ${rateLimit.resetTime}`);
   * }
   * ```
   */
  getRateLimitInfo(): RateLimitInfo | null {
    return this.http.getRateLimitInfo();
  }

  /**
   * Set a callback to be notified when rate limit info is updated after each API call.
   * Useful for monitoring rate limit consumption in real-time.
   *
   * @example
   * ```typescript
   * client.onRateLimitUpdate((info) => {
   *   if (info.remaining < 100) {
   *     console.warn(`Warning: Only ${info.remaining} API requests remaining!`);
   *   }
   * });
   * ```
   */
  onRateLimitUpdate(callback: (info: RateLimitInfo) => void): void {
    this.http.setRateLimitCallback(callback);
  }

  /**
   * Ensure OAuth credentials are configured before running OAuth-only operations.
   */
  private requireOAuthCredentials(operation: string): OAuthClient {
    if (!this.oauthClient) {
      throw new SWCError(
        `Cannot ${operation} without OAuth credentials. Initialize SWCombine with both clientId and clientSecret.`,
        { type: 'auth' }
      );
    }

    return this.oauthClient;
  }
}
