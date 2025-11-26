/**
 * Integration test setup
 */

import { config } from 'dotenv';
import { SWCombine } from '../../src/index.js';
import * as fs from 'fs';
import * as path from 'path';
import { expect } from 'vitest';

// Load environment variables
config();

// Test credentials
export const TEST_CONFIG = {
  clientId: process.env.SWC_CLIENT_ID || '',
  clientSecret: process.env.SWC_CLIENT_SECRET || '',
  accessToken: process.env.SWC_ACCESS_TOKEN || '',
  characterUid: process.env.TEST_CHARACTER_UID || '',
  characterHandle: process.env.TEST_CHARACTER_HANDLE || '',
  factionUid: process.env.TEST_FACTION_UID || '',
  // Use sector/system/planet names or UIDs - the API accepts lowercase names
  planetUid: process.env.TEST_PLANET_UID || 'coruscant',
  sectorUid: process.env.TEST_SECTOR_UID || 'bakura',
  systemUid: process.env.TEST_SYSTEM_UID || 'bakura',
};

// Directory for saving API responses
const RESPONSES_DIR = path.join(__dirname, 'api-responses');

// Ensure responses directory exists
if (!fs.existsSync(RESPONSES_DIR)) {
  fs.mkdirSync(RESPONSES_DIR, { recursive: true });
}

/**
 * Create a test client instance
 */
export function createTestClient(): SWCombine {
  if (!TEST_CONFIG.clientId || !TEST_CONFIG.clientSecret) {
    throw new Error(
      'Missing test credentials. Please set SWC_CLIENT_ID and SWC_CLIENT_SECRET in .env file'
    );
  }

  return new SWCombine({
    clientId: TEST_CONFIG.clientId,
    clientSecret: TEST_CONFIG.clientSecret,
    token: TEST_CONFIG.accessToken || undefined,
    debug: true, // Enable debug logging
  });
}

/**
 * Save API response to file for inspection
 */
export function saveResponse(filename: string, data: any): void {
  const filepath = path.join(RESPONSES_DIR, `${filename}.json`);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`✓ Saved response to ${filepath}`);
}

/**
 * Check if we have auth token
 */
export function hasAuthToken(): boolean {
  return !!TEST_CONFIG.accessToken;
}

/**
 * Skip test if no auth token
 */
export function skipIfNoAuth(test: any): void {
  if (!hasAuthToken()) {
    test.skip('Skipping: No access token provided');
  }
}

/**
 * Delay helper for rate limiting
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Validate that a response is a non-empty array
 */
export function expectArray(response: unknown, minLength = 0): asserts response is unknown[] {
  expect(response).toBeDefined();
  expect(Array.isArray(response)).toBe(true);
  if (minLength > 0) {
    expect((response as unknown[]).length).toBeGreaterThanOrEqual(minLength);
  }
}

/**
 * Validate that an object has required fields
 */
export function expectFields(obj: unknown, fields: string[]): void {
  expect(obj).toBeDefined();
  expect(typeof obj).toBe('object');
  expect(obj).not.toBeNull();
  for (const field of fields) {
    expect(obj).toHaveProperty(field);
  }
}

/**
 * Validate array items have required fields
 */
export function expectArrayWithFields(response: unknown, fields: string[], minLength = 1): void {
  expectArray(response, minLength);
  const arr = response as Record<string, unknown>[];
  if (arr.length > 0) {
    expectFields(arr[0], fields);
  }
}

/**
 * Validate a UID format (e.g., "1:12345" or "20:123")
 */
export function expectUid(uid: unknown): void {
  expect(uid).toBeDefined();
  expect(typeof uid).toBe('string');
  // UIDs can be numeric IDs or "type:id" format
  expect(uid).toBeTruthy();
}
