import { describe, it, expect } from 'vitest';
import { SWCError } from '../../src/http/errors.js';

describe('SWCError', () => {
  describe('fromHttpResponse()', () => {
    it('maps 401 to auth type', () => {
      const err = SWCError.fromHttpResponse(401, {});
      expect(err.type).toBe('auth');
      expect(err.statusCode).toBe(401);
    });

    it('maps 403 to auth type', () => {
      const err = SWCError.fromHttpResponse(403, {});
      expect(err.type).toBe('auth');
      expect(err.statusCode).toBe(403);
    });

    it('maps 404 to not_found type', () => {
      const err = SWCError.fromHttpResponse(404, {});
      expect(err.type).toBe('not_found');
    });

    it('maps 400 to validation type', () => {
      const err = SWCError.fromHttpResponse(400, {});
      expect(err.type).toBe('validation');
    });

    it('maps 422 to validation type', () => {
      const err = SWCError.fromHttpResponse(422, {});
      expect(err.type).toBe('validation');
    });

    it('maps 429 to rate_limit type', () => {
      const err = SWCError.fromHttpResponse(429, {});
      expect(err.type).toBe('rate_limit');
    });

    it('maps 5xx to server type', () => {
      const err = SWCError.fromHttpResponse(500, {});
      expect(err.type).toBe('server');
      expect(SWCError.fromHttpResponse(503, {}).type).toBe('server');
    });

    it('maps 400 with rate limit body to rate_limit type', () => {
      const err = SWCError.fromHttpResponse(400, { error: 'rate_limit_exceeded' });
      expect(err.type).toBe('rate_limit');
    });

    it('maps 400 with rate limit message to rate_limit type', () => {
      const err = SWCError.fromHttpResponse(400, { message: 'Rate limit exceeded' });
      expect(err.type).toBe('rate_limit');
    });

    it('maps 400 with rate limit error_description to rate_limit type', () => {
      const err = SWCError.fromHttpResponse(400, {
        error_description: 'Rate limit has been exceeded',
      });
      expect(err.type).toBe('rate_limit');
    });

    it('uses error_description as message when available', () => {
      const err = SWCError.fromHttpResponse(404, { error_description: 'Character not found' });
      expect(err.message).toBe('Character not found');
    });

    it('uses response.message as message when available', () => {
      const err = SWCError.fromHttpResponse(404, { message: 'Entity does not exist' });
      expect(err.message).toBe('Entity does not exist');
    });

    it('uses string error as message when available', () => {
      const err = SWCError.fromHttpResponse(500, { error: 'Internal failure' });
      expect(err.message).toBe('Internal failure');
    });

    it('extracts retry_after for rate limit errors', () => {
      const err = SWCError.fromHttpResponse(429, { retry_after: 30 });
      expect(err.retryAfter).toBe(30);
    });

    it('stores requestId', () => {
      const err = SWCError.fromHttpResponse(500, {}, 'req-abc-123');
      expect(err.requestId).toBe('req-abc-123');
    });

    it('stores original response', () => {
      const body = { error: 'something', detail: 'extra' };
      const err = SWCError.fromHttpResponse(400, body);
      expect(err.response).toBe(body);
    });
  });

  describe('fromNetworkError()', () => {
    it('creates a network type error', () => {
      const cause = new Error('ECONNREFUSED');
      const err = SWCError.fromNetworkError(cause);
      expect(err.type).toBe('network');
      expect(err.retryable).toBe(true);
      expect(err.cause).toBe(cause);
      expect(err.message).toContain('ECONNREFUSED');
    });
  });

  describe('retryable determination', () => {
    it('network errors are retryable', () => {
      const err = new SWCError('fail', { type: 'network' });
      expect(err.retryable).toBe(true);
    });

    it('server errors are retryable', () => {
      const err = new SWCError('fail', { type: 'server', statusCode: 500 });
      expect(err.retryable).toBe(true);
    });

    it('rate_limit errors are retryable', () => {
      const err = new SWCError('fail', { type: 'rate_limit' });
      expect(err.retryable).toBe(true);
    });

    it('auth errors are not retryable', () => {
      const err = new SWCError('fail', { type: 'auth' });
      expect(err.retryable).toBe(false);
    });

    it('not_found errors are not retryable', () => {
      const err = new SWCError('fail', { type: 'not_found' });
      expect(err.retryable).toBe(false);
    });

    it('validation errors are not retryable', () => {
      const err = new SWCError('fail', { type: 'validation' });
      expect(err.retryable).toBe(false);
    });

    it('explicit retryable override takes precedence', () => {
      const err = new SWCError('fail', { type: 'auth', retryable: true });
      expect(err.retryable).toBe(true);
    });
  });

  describe('isSWCError()', () => {
    it('returns true for SWCError instances', () => {
      const err = new SWCError('test', { type: 'unknown' });
      expect(SWCError.isSWCError(err)).toBe(true);
    });

    it('returns false for plain Error', () => {
      expect(SWCError.isSWCError(new Error('test'))).toBe(false);
    });

    it('returns false for non-errors', () => {
      expect(SWCError.isSWCError('string')).toBe(false);
      expect(SWCError.isSWCError(null)).toBe(false);
      expect(SWCError.isSWCError(undefined)).toBe(false);
    });
  });

  describe('toUserFriendlyMessage()', () => {
    it('returns message for auth type', () => {
      const err = new SWCError('fail', { type: 'auth' });
      expect(err.toUserFriendlyMessage()).toContain('Authentication');
    });

    it('returns message for rate_limit with retryAfter', () => {
      const err = new SWCError('fail', { type: 'rate_limit', retryAfter: 60 });
      expect(err.toUserFriendlyMessage()).toContain('60 seconds');
    });

    it('returns message for rate_limit without retryAfter', () => {
      const err = new SWCError('fail', { type: 'rate_limit' });
      expect(err.toUserFriendlyMessage()).toContain('Rate limit');
    });

    it('returns message for not_found type', () => {
      const err = new SWCError('fail', { type: 'not_found' });
      expect(err.toUserFriendlyMessage()).toContain('not found');
    });

    it('returns message for validation type', () => {
      const err = new SWCError('fail', { type: 'validation' });
      expect(err.toUserFriendlyMessage()).toContain('Invalid');
    });

    it('returns message for server type', () => {
      const err = new SWCError('fail', { type: 'server' });
      expect(err.toUserFriendlyMessage()).toContain('server error');
    });

    it('returns message for network type', () => {
      const err = new SWCError('fail', { type: 'network' });
      expect(err.toUserFriendlyMessage()).toContain('Network');
    });

    it('returns message for unknown type', () => {
      const err = new SWCError('fail', { type: 'unknown' });
      expect(err.toUserFriendlyMessage()).toContain('unexpected');
    });
  });

  describe('constructor', () => {
    it('sets name to SWCError', () => {
      const err = new SWCError('test', { type: 'unknown' });
      expect(err.name).toBe('SWCError');
    });

    it('is an instance of Error', () => {
      const err = new SWCError('test', { type: 'unknown' });
      expect(err).toBeInstanceOf(Error);
    });
  });
});
