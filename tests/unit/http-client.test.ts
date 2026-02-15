import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { HttpClient } from '../../src/http/HttpClient.js';
import { TokenManager } from '../../src/auth/TokenManager.js';
import { SWCError } from '../../src/http/errors.js';

// Mock axios at module level
vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };

  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
  };
});

function getAxiosInstance() {
  // The mock instance returned by axios.create()
  return (axios.create as ReturnType<typeof vi.fn>).mock.results[
    (axios.create as ReturnType<typeof vi.fn>).mock.results.length - 1
  ].value;
}

function getRequestInterceptor() {
  const instance = getAxiosInstance();
  // The first argument to interceptors.request.use is the success handler
  return instance.interceptors.request.use.mock.calls[0][0];
}

function getResponseInterceptors() {
  const instance = getAxiosInstance();
  // interceptors.response.use(successHandler, errorHandler)
  const call = instance.interceptors.response.use.mock.calls[0];
  return { onFulfilled: call[0], onRejected: call[1] };
}

describe('HttpClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('creates an axios instance with default options', () => {
      new HttpClient({});
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://www.swcombine.com/ws/v2.0/',
          timeout: 30000,
        })
      );
    });

    it('uses custom baseURL and timeout', () => {
      new HttpClient({ baseURL: 'https://custom.api/', timeout: 5000 });
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://custom.api/',
          timeout: 5000,
        })
      );
    });

    it('sets up request and response interceptors', () => {
      new HttpClient({});
      const instance = getAxiosInstance();
      expect(instance.interceptors.request.use).toHaveBeenCalled();
      expect(instance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('request interceptor - token injection', () => {
    it('adds access_token as query param when TokenManager has token', async () => {
      const tm = new TokenManager('test-token-abc');
      new HttpClient({}, tm);
      const interceptor = getRequestInterceptor();

      const config = { params: {} } as any;
      const result = await interceptor(config);
      expect(result.params.access_token).toBe('test-token-abc');
    });

    it('does not add token when TokenManager has no token', async () => {
      const tm = new TokenManager();
      new HttpClient({}, tm);
      const interceptor = getRequestInterceptor();

      const config = { params: {} } as any;
      const result = await interceptor(config);
      expect(result.params.access_token).toBeUndefined();
    });

    it('does not fail when no TokenManager', async () => {
      new HttpClient({});
      const interceptor = getRequestInterceptor();

      const config = { params: {} } as any;
      const result = await interceptor(config);
      expect(result.params.access_token).toBeUndefined();
    });

    it('initializes params if undefined', async () => {
      const tm = new TokenManager('token');
      new HttpClient({}, tm);
      const interceptor = getRequestInterceptor();

      const config = {} as any;
      const result = await interceptor(config);
      expect(result.params).toBeDefined();
      expect(result.params.access_token).toBe('token');
    });
  });

  describe('response interceptor - swcapi unwrapping', () => {
    it('unwraps single-key swcapi wrapper', () => {
      new HttpClient({});
      const { onFulfilled } = getResponseInterceptors();

      const response = {
        data: { swcapi: { character: { name: 'Luke' } } },
        headers: {},
      };
      const result = onFulfilled(response);
      expect(result.data).toEqual({ name: 'Luke' });
    });

    it('returns swcapi object when multiple keys', () => {
      new HttpClient({});
      const { onFulfilled } = getResponseInterceptors();

      const response = {
        data: { swcapi: { character: { name: 'Luke' }, meta: {} } },
        headers: {},
      };
      const result = onFulfilled(response);
      expect(result.data).toEqual({ character: { name: 'Luke' }, meta: {} });
    });

    it('passes through non-swcapi responses', () => {
      new HttpClient({});
      const { onFulfilled } = getResponseInterceptors();

      const response = {
        data: { name: 'direct' },
        headers: {},
      };
      const result = onFulfilled(response);
      expect(result.data).toEqual({ name: 'direct' });
    });
  });

  describe('response interceptor - rate limit extraction', () => {
    it('extracts rate limit headers and calls callback', () => {
      const callback = vi.fn();
      new HttpClient({ onRateLimitUpdate: callback });
      const { onFulfilled } = getResponseInterceptors();

      const response = {
        data: 'ok',
        headers: {
          'x-ratelimit-limit': '1000',
          'x-ratelimit-remaining': '999',
          'x-ratelimit-reset': '1704067200',
          'x-ratelimit-resettime': '2024-01-01T00:00:00Z',
        },
      };
      onFulfilled(response);

      expect(callback).toHaveBeenCalledWith({
        limit: 1000,
        remaining: 999,
        reset: 1704067200,
        resetTime: '2024-01-01T00:00:00Z',
      });
    });

    it('stores rate limit info accessible via getRateLimitInfo()', () => {
      const client = new HttpClient({});
      const { onFulfilled } = getResponseInterceptors();

      expect(client.getRateLimitInfo()).toBeNull();

      onFulfilled({
        data: 'ok',
        headers: {
          'x-ratelimit-limit': '500',
          'x-ratelimit-remaining': '499',
          'x-ratelimit-reset': '1704067200',
        },
      });

      const info = client.getRateLimitInfo();
      expect(info).not.toBeNull();
      expect(info!.limit).toBe(500);
      expect(info!.remaining).toBe(499);
    });
  });

  describe('response interceptor - error conversion', () => {
    it('converts HTTP errors to SWCError', async () => {
      new HttpClient({ maxRetries: 0 });
      const { onRejected } = getResponseInterceptors();

      const axiosError = {
        response: {
          status: 404,
          data: { message: 'Not found' },
          headers: {},
        },
        config: { _retryCount: 0 },
        isAxiosError: true,
      };

      await expect(onRejected(axiosError)).rejects.toThrow(SWCError);
      try {
        await onRejected(axiosError);
      } catch (e) {
        expect((e as SWCError).type).toBe('not_found');
        expect((e as SWCError).statusCode).toBe(404);
      }
    });

    it('converts network errors to SWCError', async () => {
      new HttpClient({ maxRetries: 0 });
      const { onRejected } = getResponseInterceptors();

      const axiosError = {
        request: {},
        response: undefined,
        config: { _retryCount: 999 }, // exceed retries
        message: 'Network Error',
        isAxiosError: true,
      };

      await expect(onRejected(axiosError)).rejects.toThrow(SWCError);
      try {
        await onRejected(axiosError);
      } catch (e) {
        expect((e as SWCError).type).toBe('network');
      }
    });
  });

  describe('HTTP methods', () => {
    it('get() returns response.data', async () => {
      const client = new HttpClient({});
      const instance = getAxiosInstance();
      instance.get.mockResolvedValue({ data: { result: 'ok' } });

      const result = await client.get('/test');
      expect(instance.get).toHaveBeenCalledWith('/test', undefined);
      expect(result).toEqual({ result: 'ok' });
    });

    it('post() returns response.data', async () => {
      const client = new HttpClient({});
      const instance = getAxiosInstance();
      instance.post.mockResolvedValue({ data: { created: true } });

      const result = await client.post('/test', { key: 'val' });
      expect(instance.post).toHaveBeenCalledWith('/test', { key: 'val' }, undefined);
      expect(result).toEqual({ created: true });
    });

    it('put() returns response.data', async () => {
      const client = new HttpClient({});
      const instance = getAxiosInstance();
      instance.put.mockResolvedValue({ data: { updated: true } });

      const result = await client.put('/test', { key: 'val' });
      expect(instance.put).toHaveBeenCalledWith('/test', { key: 'val' }, undefined);
      expect(result).toEqual({ updated: true });
    });

    it('delete() returns response.data', async () => {
      const client = new HttpClient({});
      const instance = getAxiosInstance();
      instance.delete.mockResolvedValue({ data: { deleted: true } });

      const result = await client.delete('/test');
      expect(instance.delete).toHaveBeenCalledWith('/test', undefined);
      expect(result).toEqual({ deleted: true });
    });
  });

  describe('setTokenManager()', () => {
    it('sets token manager for late initialization', () => {
      const client = new HttpClient({});
      const tm = new TokenManager('late-token');
      client.setTokenManager(tm);
      // Verify it doesn't throw - internal state updated
    });
  });

  describe('setRateLimitCallback()', () => {
    it('sets callback for rate limit updates', () => {
      const client = new HttpClient({});
      const callback = vi.fn();
      client.setRateLimitCallback(callback);
      // Verify it doesn't throw
    });
  });
});
