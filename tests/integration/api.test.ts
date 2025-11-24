/**
 * Integration tests for API resource
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SWCombine } from '../../src/index.js';
import { createTestClient, saveResponse, delay } from './setup.js';
import { validateRateLimitInfo, validateArray } from './validators.js';

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

    // Document the response type
    console.log(`\n📊 HelloWorld response type: ${typeof response}`);
    if (typeof response === 'object') {
      console.log(`   Top-level fields:`, Object.keys(response).join(', '));
    }

    await delay(100); // Rate limiting
  });

  it('should call HelloAuth endpoint', async () => {
    try {
      const response = await client.api.helloAuth();

      console.log('HelloAuth Response:', JSON.stringify(response, null, 2));
      saveResponse('api-helloauth', response);

      expect(response).toBeDefined();
      expect(typeof response).toBe('object');

      // Document the structure
      console.log(`\n📊 HelloAuth response structure:`);
      console.log(`   Top-level fields:`, Object.keys(response).join(', '));
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

    console.log('Permissions Response:', JSON.stringify(response, null, 2).substring(0, 500));
    saveResponse('api-permissions', response);

    expect(response).toBeDefined();
    expect(typeof response).toBe('object');

    // Document the structure
    console.log(`\n📊 Permissions response structure:`);
    console.log(`   Top-level fields:`, Object.keys(response).join(', '));

    await delay(100);
  });

  it('should get rate limit status', async () => {
    const response = await client.api.rateLimits();

    console.log('RateLimits Response:', JSON.stringify(response, null, 2));
    saveResponse('api-ratelimits', response);

    expect(response).toBeDefined();
    expect(typeof response).toBe('object');

    // Document the structure
    console.log(`\n📊 RateLimits response structure:`);
    console.log(`   Top-level fields:`, Object.keys(response).join(', '));

    await delay(100);
  });

  it('should get current time', async () => {
    const response = await client.api.time();

    console.log('Time Response:', JSON.stringify(response, null, 2));
    saveResponse('api-time', response);

    expect(response).toBeDefined();
    expect(typeof response).toBe('object');

    // Document the structure
    console.log(`\n📊 Time response structure:`);
    console.log(`   Top-level fields:`, Object.keys(response).join(', '));

    await delay(100);
  });
});
