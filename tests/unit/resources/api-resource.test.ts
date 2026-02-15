import { describe, it, expect } from 'vitest';
import { ApiResource } from '../../../src/resources/ApiResource.js';
import { createMockHttpClient } from '../helpers/mock-http.js';
import type { HttpClient } from '../../../src/http/HttpClient.js';

describe('ApiResource', () => {
  function createResource() {
    const mockHttp = createMockHttpClient();
    const resource = new ApiResource(mockHttp as unknown as HttpClient);
    return { resource, mockHttp };
  }

  describe('helloWorld()', () => {
    it('sends GET to /api/helloworld', async () => {
      const { resource, mockHttp } = createResource();
      mockHttp.get.mockResolvedValue('Hello World');

      const result = await resource.helloWorld();
      expect(mockHttp.get).toHaveBeenCalledWith('/api/helloworld');
      expect(result).toBe('Hello World');
    });
  });

  describe('helloAuth()', () => {
    it('sends GET to /api/helloauth', async () => {
      const { resource, mockHttp } = createResource();
      mockHttp.get.mockResolvedValue({ message: 'Hello', client: 42 });

      const result = await resource.helloAuth();
      expect(mockHttp.get).toHaveBeenCalledWith('/api/helloauth');
      expect(result).toEqual({ message: 'Hello', client: 42 });
    });
  });

  describe('permissions()', () => {
    it('unwraps permission array from response', async () => {
      const perms = [
        { attributes: { name: 'read', description: 'Read access', inherits: '' } },
      ];
      const { resource, mockHttp } = createResource();
      mockHttp.get.mockResolvedValue({ permission: perms, attributes: {} });

      const result = await resource.permissions();
      expect(mockHttp.get).toHaveBeenCalledWith('/api/permissions');
      expect(result).toEqual(perms);
    });

    it('returns empty array when permission key is missing', async () => {
      const { resource, mockHttp } = createResource();
      mockHttp.get.mockResolvedValue({ attributes: {} });

      const result = await resource.permissions();
      expect(result).toEqual([]);
    });
  });

  describe('rateLimits()', () => {
    it('unwraps ratelimit array from response', async () => {
      const limits = [
        {
          attributes: {
            pattern: '/api/*',
            limit: 100,
            remaining: 95,
            reset: 1234567890,
            reset_time: '2025-01-01T00:00:00Z',
          },
        },
      ];
      const { resource, mockHttp } = createResource();
      mockHttp.get.mockResolvedValue({ ratelimit: limits, attributes: {} });

      const result = await resource.rateLimits();
      expect(mockHttp.get).toHaveBeenCalledWith('/api/ratelimits');
      expect(result).toEqual(limits);
    });

    it('returns empty array when ratelimit key is missing', async () => {
      const { resource, mockHttp } = createResource();
      mockHttp.get.mockResolvedValue({ attributes: {} });

      const result = await resource.rateLimits();
      expect(result).toEqual([]);
    });
  });

  describe('time()', () => {
    it('sends GET when no arguments', async () => {
      const { resource, mockHttp } = createResource();
      const timeData = { years: 25, days: 100, hours: 12, mins: 30, secs: 0 };
      mockHttp.get.mockResolvedValue(timeData);

      const result = await resource.time();
      expect(mockHttp.get).toHaveBeenCalledWith('/api/time');
      expect(result).toEqual(timeData);
    });

    it('sends POST with cgt option', async () => {
      const { resource, mockHttp } = createResource();
      const timeData = { years: 25, days: 100, hours: 12, mins: 30, secs: 0, timestamp: 123 };
      mockHttp.post.mockResolvedValue(timeData);

      const result = await resource.time({ cgt: '2025-01-01 12:00:00' });
      expect(mockHttp.post).toHaveBeenCalledWith('/api/time', { cgt: '2025-01-01 12:00:00' });
      expect(result).toEqual(timeData);
    });

    it('sends POST with time option', async () => {
      const { resource, mockHttp } = createResource();
      const timeData = { years: 25, days: 100, hours: 12, mins: 30, secs: 0, timestamp: 123 };
      mockHttp.post.mockResolvedValue(timeData);

      const result = await resource.time({ time: 1701432000 });
      expect(mockHttp.post).toHaveBeenCalledWith('/api/time', { time: 1701432000 });
      expect(result).toEqual(timeData);
    });

    it('sends GET with empty options object', async () => {
      const { resource, mockHttp } = createResource();
      mockHttp.get.mockResolvedValue({ years: 25, days: 1, hours: 0, mins: 0, secs: 0 });

      await resource.time({});
      expect(mockHttp.get).toHaveBeenCalledWith('/api/time');
    });
  });

  describe('getResources()', () => {
    it('sends GET to /', async () => {
      const { resource, mockHttp } = createResource();
      const resources = [{ name: 'character', href: '/character' }];
      mockHttp.get.mockResolvedValue(resources);

      const result = await resource.getResources();
      expect(mockHttp.get).toHaveBeenCalledWith('/');
      expect(result).toEqual(resources);
    });
  });
});
