/**
 * Token management for OAuth tokens
 */

import { OAuthToken } from '../types/index.js';
import { SWCError } from '../http/errors.js';

export interface TokenStorage {
  /** Save token to storage */
  saveToken(token: OAuthToken): Promise<void> | void;
  /** Load token from storage */
  loadToken(): Promise<OAuthToken | null> | OAuthToken | null;
  /** Clear token from storage */
  clearToken(): Promise<void> | void;
}

/**
 * Manages OAuth tokens including expiration and refresh
 */
export class TokenManager {
  private token: OAuthToken | null = null;
  private storage?: TokenStorage;
  private refreshCallback?: () => Promise<OAuthToken>;

  constructor(token?: OAuthToken | string, storage?: TokenStorage) {
    if (token) {
      if (typeof token === 'string') {
        // Initialize with just access token (no expiry known)
        this.token = {
          accessToken: token,
          expiresAt: Date.now() + 3600 * 1000, // Assume 1 hour
        };
      } else {
        this.token = token;
      }
    }
    this.storage = storage;
  }

  /**
   * Set token.
   *
   * If the incoming token does not include a refresh token but we already
   * have one stored, preserve the existing refresh token. This matches the
   * SW Combine OAuth2 contract: refresh tokens are only issued the first
   * time a user authorizes, and the refresh-token grant response also does
   * not include a new refresh token. Without this merge behavior, a second
   * `handleCallback` or auto-refresh would silently drop the refresh token
   * on the floor, leaving the client unable to recover from future 401s.
   *
   * To explicitly clear the entire token (including the refresh token),
   * use {@link clear} instead.
   */
  setToken(token: OAuthToken | string): void {
    const existingRefreshToken = this.token?.refreshToken;

    if (typeof token === 'string') {
      this.token = {
        accessToken: token,
        expiresAt: Date.now() + 3600 * 1000,
      };
    } else {
      this.token = { ...token };
    }

    // Preserve an existing refresh token if the new token doesn't carry one.
    if (!this.token.refreshToken && existingRefreshToken) {
      this.token.refreshToken = existingRefreshToken;
    }

    // Save to storage if available
    if (this.storage && this.token) {
      void this.storage.saveToken(this.token);
    }
  }

  /**
   * Get current token
   */
  getToken(): OAuthToken | null {
    return this.token;
  }

  /**
   * Get access token (refreshes if expired)
   */
  async getAccessToken(): Promise<string | null> {
    if (!this.token) {
      return null;
    }

    // Check if token is expired or about to expire (within 5 minutes)
    if (this.shouldRefresh()) {
      await this.refreshToken();
    }

    return this.token?.accessToken ?? null;
  }

  /**
   * Check if token is expired
   */
  isExpired(): boolean {
    if (!this.token) {
      return true;
    }
    return Date.now() >= this.token.expiresAt;
  }

  /**
   * Check if token should be refreshed (expired or expiring soon)
   */
  shouldRefresh(): boolean {
    if (!this.token) {
      return false;
    }
    // Refresh if expired or expiring within 5 minutes
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() >= this.token.expiresAt - fiveMinutes;
  }

  /**
   * Check if refresh token is available
   */
  hasRefreshToken(): boolean {
    return !!this.token?.refreshToken;
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return this.token?.refreshToken ?? null;
  }

  /**
   * Refresh the access token
   */
  async refreshToken(): Promise<void> {
    if (!this.refreshCallback) {
      throw new SWCError('Cannot refresh access token: refresh callback is not configured.', {
        type: 'auth',
      });
    }

    if (!this.hasRefreshToken()) {
      throw new SWCError('Cannot refresh access token: no refresh token is available.', {
        type: 'auth',
      });
    }

    // Call the refresh callback to get new token
    const newToken = await this.refreshCallback();
    this.setToken(newToken);
  }

  /**
   * Set callback for token refresh
   */
  setRefreshCallback(callback: () => Promise<OAuthToken>): void {
    this.refreshCallback = callback;
  }

  /**
   * Clear token
   */
  clear(): void {
    this.token = null;
    if (this.storage) {
      void this.storage.clearToken();
    }
  }

  /**
   * Load token from storage
   */
  async loadFromStorage(): Promise<void> {
    if (!this.storage) {
      return;
    }

    const token = await this.storage.loadToken();
    if (token) {
      this.token = token;
    }
  }
}
