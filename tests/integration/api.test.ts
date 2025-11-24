/**
 * Integration tests for API resource
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SWCombine } from '../../src/index.js';
import { createTestClient, saveResponse, delay } from './setup.js';

describe('API Resource Integration Tests', () => {
  let client: SWCombine;

  beforeAll(() => {
    client = createTestClient();
  });

  it('should call HelloWorld endpoint', async () => {
    const response = await client.api.helloWorld();

    console.log('HelloWorld Response:', response);
    saveResponse('api-helloworld', response);

    expect(response).toBeDefined();
    expect(response.message).toBeDefined();

    await delay(100); // Rate limiting
  });

  it('should call HelloAuth endpoint', async () => {
    try {
      const response = await client.api.helloAuth();

      console.log('HelloAuth Response:', response);
      saveResponse('api-helloauth', response);

      expect(response).toBeDefined();
      expect(response.message).toBeDefined();
    } catch (error: any) {
      console.log('HelloAuth Error:', error.message);
      // This might fail if not authenticated - that's okay for discovery
      if (error.statusCode !== 401) {
        throw error;
      }
    }

    await delay(100);
  });

  it('should get permissions list', async () => {
    const response = await client.api.permissions();

    console.log('Permissions Response (first 5):', response.slice(0, 5));
    saveResponse('api-permissions', response);

    expect(response).toBeDefined();
    expect(Array.isArray(response)).toBe(true);
    expect(response.length).toBeGreaterThan(0);

    await delay(100);
  });

  it('should get rate limit status', async () => {
    const response = await client.api.rateLimits();

    console.log('RateLimits Response:', response);
    saveResponse('api-ratelimits', response);

    expect(response).toBeDefined();
    expect(response.limit).toBeDefined();
    expect(response.remaining).toBeDefined();
    expect(response.reset).toBeDefined();

    await delay(100);
  });

  it('should get current time', async () => {
    const response = await client.api.time();

    console.log('Time Response:', response);
    saveResponse('api-time', response);

    expect(response).toBeDefined();
    expect(response.currentTime || response.timestamp).toBeDefined();

    await delay(100);
  });
});
