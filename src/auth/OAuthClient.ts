/**
 * OAuth 2.0 client for SW Combine API
 */

import axios from 'axios';
import {
  OAuthToken,
  OAuthAuthorizationOptions,
  OAuthCallbackQuery,
  AuthorizationResult,
  GrantType,
  AccessType,
} from '../types/index.js';
import { SWCError } from '../http/errors.js';

// OAuth endpoints
const OAUTH_ENDPOINT_AUTH = 'https://www.swcombine.com/ws/oauth2/auth/';
const OAUTH_ENDPOINT_TOKEN = 'https://www.swcombine.com/ws/oauth2/token/';
const OAUTH_ENDPOINT_REVOKE = 'https://www.swcombine.com/ws/oauth2/revoke';

export interface OAuthClientConfig {
  clientId: string;
  clientSecret: string;
  redirectUri?: string;
  accessType?: AccessType;
  /** Whether to renew previously granted permissions */
  renewPreviouslyGranted?: boolean;
}

/**
 * OAuth client for handling authorization flows
 */
export class OAuthClient {
  private clientId: string;
  private clientSecret: string;
  private redirectUri?: string;
  private accessType: AccessType;
  private renewPreviouslyGranted: boolean;

  constructor(config: OAuthClientConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.redirectUri = config.redirectUri;
    this.accessType = config.accessType ?? AccessType.Online;
    this.renewPreviouslyGranted = config.renewPreviouslyGranted ?? false;
  }

  /**
   * Get authorization URL for redirecting user
   */
  getAuthorizationUrl(options: OAuthAuthorizationOptions): string {
    if (!this.redirectUri) {
      throw new Error('redirectUri is required for authorization flow');
    }

    const params: Record<string, string> = {
      response_type: 'code',
      client_id: this.clientId,
      scope: options.scopes.join(' '),
      redirect_uri: this.redirectUri,
      state: options.state,
      access_type: this.accessType,
    };

    // Add optional renewPreviouslyGranted parameter
    if (this.renewPreviouslyGranted) {
      params.renew_previously_granted = 'yes';
    }

    const searchParams = new URLSearchParams(params);
    return `${OAUTH_ENDPOINT_AUTH}?${searchParams.toString()}`;
  }

  /**
   * Handle OAuth callback and exchange code for token
   */
  async handleCallback(query: OAuthCallbackQuery): Promise<AuthorizationResult> {
    // Check for error in callback
    if (query.error) {
      return {
        success: false,
        error: query.error_description || query.error,
        state: query.state,
      };
    }

    // Check for authorization code
    if (!query.code) {
      return {
        success: false,
        error: 'No authorization code received',
        state: query.state,
      };
    }

    try {
      // Exchange code for token
      const token = await this.exchangeCodeForToken(query.code);

      return {
        success: true,
        token,
        state: query.state,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token exchange failed',
        state: query.state,
      };
    }
  }

  /**
   * Exchange authorization code for access token
   */
  private async exchangeCodeForToken(code: string): Promise<OAuthToken> {
    if (!this.redirectUri) {
      throw new Error('redirectUri is required for token exchange');
    }

    // Note: access_type is only used in authorization URL, not token exchange
    const params = new URLSearchParams({
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      grant_type: GrantType.AuthorizationCode,
      access_type: this.accessType,
    });

    try {
      const response = await axios.post(OAUTH_ENDPOINT_TOKEN, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
      });

      if (response.data.error) {
        throw new SWCError(`Failed to get token: ${response.data.error}`, {
          type: 'auth',
          response: response.data,
        });
      }

      return this.parseTokenResponse(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw SWCError.fromHttpResponse(
          error.response.status,
          error.response.data,
          error.response.headers['x-request-id']
        );
      }
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<OAuthToken> {
    const params = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: GrantType.RefreshToken,
    });

    try {
      const response = await axios.post(OAUTH_ENDPOINT_TOKEN, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
      });

      if (response.data.error) {
        throw new SWCError(`Failed to refresh token: ${response.data.error}`, {
          type: 'auth',
          response: response.data,
        });
      }

      return this.parseTokenResponse(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw SWCError.fromHttpResponse(
          error.response.status,
          error.response.data,
          error.response.headers['x-request-id']
        );
      }
      throw error;
    }
  }

  /**
   * Parse token response from API
   */
  private parseTokenResponse(data: Record<string, unknown>): OAuthToken {
    const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 3600;
    const expiresAt = Date.now() + expiresIn * 1000;

    return {
      accessToken: data.access_token as string,
      refreshToken: data.refresh_token as string | undefined,
      expiresAt,
    };
  }

  /**
   * Revoke a refresh token
   */
  async revokeToken(refreshToken: string): Promise<void> {
    const params = new URLSearchParams({
      token: refreshToken,
      client_id: this.clientId,
    });

    try {
      const response = await axios.get(`${OAUTH_ENDPOINT_REVOKE}?${params.toString()}`);

      if (response.status !== 200) {
        throw new SWCError('Failed to revoke token', {
          type: 'auth',
          statusCode: response.status,
          response: response.data,
        });
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw SWCError.fromHttpResponse(
          error.response.status,
          error.response.data,
          error.response.headers['x-request-id']
        );
      }
      throw error;
    }
  }
}
