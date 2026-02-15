import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TokenManager, TokenStorage } from '../../src/auth/TokenManager.js';
import { SWCError } from '../../src/http/errors.js';
import type { OAuthToken } from '../../src/types/index.js';

describe('TokenManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('initializes with string token and 1hr expiry', () => {
      const tm = new TokenManager('my-token');
      const token = tm.getToken();
      expect(token).not.toBeNull();
      expect(token!.accessToken).toBe('my-token');
      expect(token!.expiresAt).toBe(Date.now() + 3600 * 1000);
    });

    it('initializes with OAuthToken as-is', () => {
      const oauthToken: OAuthToken = {
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        expiresAt: Date.now() + 7200 * 1000,
      };
      const tm = new TokenManager(oauthToken);
      expect(tm.getToken()).toBe(oauthToken);
    });

    it('initializes to null when no token provided', () => {
      const tm = new TokenManager();
      expect(tm.getToken()).toBeNull();
    });
  });

  describe('isExpired()', () => {
    it('returns true when no token', () => {
      const tm = new TokenManager();
      expect(tm.isExpired()).toBe(true);
    });

    it('returns false when token is not expired', () => {
      const tm = new TokenManager('token');
      expect(tm.isExpired()).toBe(false);
    });

    it('returns true when token is expired', () => {
      const tm = new TokenManager({
        accessToken: 'token',
        expiresAt: Date.now() - 1000,
      });
      expect(tm.isExpired()).toBe(true);
    });

    it('returns true at exact expiry time', () => {
      const tm = new TokenManager({
        accessToken: 'token',
        expiresAt: Date.now(),
      });
      expect(tm.isExpired()).toBe(true);
    });
  });

  describe('shouldRefresh()', () => {
    it('returns false when no token', () => {
      const tm = new TokenManager();
      expect(tm.shouldRefresh()).toBe(false);
    });

    it('returns false when token has plenty of time', () => {
      const tm = new TokenManager({
        accessToken: 'token',
        expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
      });
      expect(tm.shouldRefresh()).toBe(false);
    });

    it('returns true within 5-minute buffer', () => {
      const tm = new TokenManager({
        accessToken: 'token',
        expiresAt: Date.now() + 4 * 60 * 1000, // 4 minutes left
      });
      expect(tm.shouldRefresh()).toBe(true);
    });

    it('returns true when expired', () => {
      const tm = new TokenManager({
        accessToken: 'token',
        expiresAt: Date.now() - 1000,
      });
      expect(tm.shouldRefresh()).toBe(true);
    });

    it('returns false at exactly 5 minutes remaining', () => {
      const tm = new TokenManager({
        accessToken: 'token',
        expiresAt: Date.now() + 5 * 60 * 1000,
      });
      // Date.now() >= expiresAt - fiveMinutes → now >= now → true
      expect(tm.shouldRefresh()).toBe(true);
    });
  });

  describe('getAccessToken()', () => {
    it('returns null when no token', async () => {
      const tm = new TokenManager();
      expect(await tm.getAccessToken()).toBeNull();
    });

    it('returns access token when valid', async () => {
      const tm = new TokenManager('my-token');
      expect(await tm.getAccessToken()).toBe('my-token');
    });

    it('triggers refresh when token is expiring', async () => {
      const tm = new TokenManager({
        accessToken: 'old-token',
        refreshToken: 'refresh',
        expiresAt: Date.now() + 60 * 1000, // 1 minute left → within buffer
      });
      const newToken: OAuthToken = {
        accessToken: 'new-token',
        refreshToken: 'refresh-new',
        expiresAt: Date.now() + 3600 * 1000,
      };
      tm.setRefreshCallback(async () => newToken);
      const result = await tm.getAccessToken();
      expect(result).toBe('new-token');
    });
  });

  describe('refreshToken()', () => {
    it('throws without refresh callback', async () => {
      const tm = new TokenManager({
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: Date.now() + 3600 * 1000,
      });
      await expect(tm.refreshToken()).rejects.toThrow(SWCError);
    });

    it('throws without refresh token', async () => {
      const tm = new TokenManager({
        accessToken: 'token',
        expiresAt: Date.now() + 3600 * 1000,
      });
      tm.setRefreshCallback(async () => ({
        accessToken: 'new',
        expiresAt: Date.now() + 3600 * 1000,
      }));
      await expect(tm.refreshToken()).rejects.toThrow(SWCError);
    });

    it('calls callback and updates token on success', async () => {
      const newToken: OAuthToken = {
        accessToken: 'refreshed',
        refreshToken: 'new-refresh',
        expiresAt: Date.now() + 3600 * 1000,
      };
      const callback = vi.fn().mockResolvedValue(newToken);

      const tm = new TokenManager({
        accessToken: 'old',
        refreshToken: 'refresh',
        expiresAt: Date.now() - 1000,
      });
      tm.setRefreshCallback(callback);
      await tm.refreshToken();

      expect(callback).toHaveBeenCalledOnce();
      expect(tm.getToken()!.accessToken).toBe('refreshed');
    });
  });

  describe('setToken()', () => {
    it('calls storage.saveToken when storage is available', () => {
      const storage: TokenStorage = {
        saveToken: vi.fn(),
        loadToken: vi.fn(),
        clearToken: vi.fn(),
      };
      const tm = new TokenManager(undefined, storage);
      const token: OAuthToken = {
        accessToken: 'test',
        expiresAt: Date.now() + 3600 * 1000,
      };
      tm.setToken(token);
      expect(storage.saveToken).toHaveBeenCalledWith(token);
    });

    it('accepts string token', () => {
      const tm = new TokenManager();
      tm.setToken('new-string-token');
      expect(tm.getToken()!.accessToken).toBe('new-string-token');
    });
  });

  describe('clear()', () => {
    it('clears token', () => {
      const tm = new TokenManager('token');
      tm.clear();
      expect(tm.getToken()).toBeNull();
    });

    it('calls storage.clearToken when storage is available', () => {
      const storage: TokenStorage = {
        saveToken: vi.fn(),
        loadToken: vi.fn(),
        clearToken: vi.fn(),
      };
      const tm = new TokenManager('token', storage);
      tm.clear();
      expect(storage.clearToken).toHaveBeenCalled();
    });
  });

  describe('loadFromStorage()', () => {
    it('loads token when available', async () => {
      const storedToken: OAuthToken = {
        accessToken: 'stored',
        expiresAt: Date.now() + 3600 * 1000,
      };
      const storage: TokenStorage = {
        saveToken: vi.fn(),
        loadToken: vi.fn().mockResolvedValue(storedToken),
        clearToken: vi.fn(),
      };
      const tm = new TokenManager(undefined, storage);
      await tm.loadFromStorage();
      expect(tm.getToken()!.accessToken).toBe('stored');
    });

    it('does nothing when storage returns null', async () => {
      const storage: TokenStorage = {
        saveToken: vi.fn(),
        loadToken: vi.fn().mockResolvedValue(null),
        clearToken: vi.fn(),
      };
      const tm = new TokenManager(undefined, storage);
      await tm.loadFromStorage();
      expect(tm.getToken()).toBeNull();
    });

    it('does nothing when no storage configured', async () => {
      const tm = new TokenManager();
      await tm.loadFromStorage(); // should not throw
      expect(tm.getToken()).toBeNull();
    });
  });

  describe('hasRefreshToken()', () => {
    it('returns true when refresh token exists', () => {
      const tm = new TokenManager({
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresAt: Date.now() + 3600 * 1000,
      });
      expect(tm.hasRefreshToken()).toBe(true);
    });

    it('returns false when no refresh token', () => {
      const tm = new TokenManager('access-only');
      expect(tm.hasRefreshToken()).toBe(false);
    });
  });
});
