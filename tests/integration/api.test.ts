/**
 * Integration tests for API resource
 * Tests all read-only API endpoints
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SWCombine } from '../../src/index.js';
import { createTestClient, saveResponse, expectFields, hasAuthToken } from './setup.js';

describe('API Resource Integration Tests', () => {
  let client: SWCombine;

  beforeAll(() => {
    client = createTestClient();
  });

  it('should get list of available resources', async () => {
    const response = await client.api.getResources();
    saveResponse('api-get-resources', response);

    expect(response).toBeDefined();
    expect(typeof response).toBe('object');
  });

  it('should call HelloWorld endpoint', async () => {
    const response = await client.api.helloWorld();
    saveResponse('api-helloworld', response);

    expect(response).toBeDefined();
    // HelloWorld returns a string message
    expect(typeof response).toBe('string');
    expect(response).toContain('Hello');
  });

  it('should call HelloAuth endpoint', async () => {
    if (!hasAuthToken()) {
      console.log('⊘ Skipping HelloAuth: No auth token');
      return;
    }

    const response = await client.api.helloAuth();
    saveResponse('api-helloauth', response);

    expect(response).toBeDefined();
    expect(typeof response).toBe('object');
    // HelloAuth returns a message and client ID
    expectFields(response, ['message', 'client']);
  });

  it('should get permissions list', async () => {
    const response = await client.api.permissions();
    saveResponse('api-permissions', response);

    expect(response).toBeDefined();
    expect(typeof response).toBe('object');
    // Permissions returns a list of available permissions
    expectFields(response, ['permission']);
  });

  it('should get rate limit status', async () => {
    const response = await client.api.rateLimits();
    saveResponse('api-ratelimits', response);

    expect(response).toBeDefined();
    expect(typeof response).toBe('object');
  });

  it('should get current time', async () => {
    const response = await client.api.time();
    saveResponse('api-time', response);

    expect(response).toBeDefined();
    expect(typeof response).toBe('object');
    // Current time response has years, days, hours, mins, secs (no timestamp)
    expectFields(response, ['years', 'days', 'hours']);
  });

  it('should convert unix timestamp to CGT', async () => {
    const unixTime = Math.floor(Date.now() / 1000);
    const response = await client.api.time({ time: unixTime });
    saveResponse('api-time-convert-unix', response);

    expect(response).toBeDefined();
    expect(typeof response).toBe('object');
    // Response has years, days, hours, mins, secs, timestamp
    expectFields(response, ['years', 'days', 'timestamp']);
  });

  it('should convert CGT to unix timestamp', async () => {
    // CGT format: "Y##D###" e.g., "Y26D100" for Year 26, Day 100
    const cgtTime = 'Y26D100';
    const response = await client.api.time({ cgt: cgtTime });
    saveResponse('api-time-convert-cgt', response);

    expect(response).toBeDefined();
    expect(typeof response).toBe('object');
    // Response has years, days, hours, mins, secs, timestamp
    expectFields(response, ['years', 'days', 'timestamp']);
  });
});
