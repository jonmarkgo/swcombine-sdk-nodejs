/**
 * Integration test setup
 */

import { config } from 'dotenv';
import { SWCombine } from '../../src/index.js';
import * as fs from 'fs';
import * as path from 'path';

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
  planetUid: process.env.TEST_PLANET_UID || '1',
  sectorUid: process.env.TEST_SECTOR_UID || '1',
  systemUid: process.env.TEST_SYSTEM_UID || '1',
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
