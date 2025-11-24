/**
 * Integration tests for Market resource
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SWCombine } from '../../src/index.js';
import { createTestClient, saveResponse, delay } from './setup.js';

describe('Market Resource Integration Tests', () => {
  let client: SWCombine;

  beforeAll(() => {
    client = createTestClient();
  });

  it('should list all public vendors', async () => {
    try {
      const response = await client.market.vendors.list();

      console.log('Vendors List Response (count):', response.length);
      if (response.length > 0) {
        console.log('First vendor:', response[0]);
      }
      saveResponse('market-vendors-list', response);

      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBe(true);

      // Document vendors structure
      if (response.length > 0) {
        console.log(`\n📊 Vendors array structure:`);
        console.log(`   Total vendors: ${response.length}`);
        console.log(`   First vendor fields:`, Object.keys(response[0]).join(', '));
      }
    } catch (error: any) {
      console.log('Vendors List Error:', error.message, error.statusCode);
      saveResponse('market-vendors-list-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  });

  it('should get specific vendor (if any exist)', async () => {
    try {
      // First get list to find a vendor
      const vendors = await client.market.vendors.list();

      if (vendors.length === 0) {
        console.log('⊘ Skipping: No public vendors available');
        return;
      }

      const vendorUid = vendors[0].uid;
      const response = await client.market.vendors.get({ uid: vendorUid });

      console.log('Vendor Get Response:', response);
      saveResponse('market-vendor-get', response);

      expect(response).toBeDefined();
      expect(response.uid).toBe(vendorUid);

      // Document vendor structure
      console.log(`\n📊 Vendor fields:`, Object.keys(response).join(', '));
    } catch (error: any) {
      console.log('Vendor Get Error:', error.message, error.statusCode);
      saveResponse('market-vendor-get-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  });
});
