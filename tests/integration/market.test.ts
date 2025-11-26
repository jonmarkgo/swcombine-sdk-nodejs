/**
 * Integration tests for Market resource
 * Tests all read-only Market endpoints
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SWCombine } from '../../src/index.js';
import {
  createTestClient,
  saveResponse,
  expectArray,
  expectFields,
} from './setup.js';

describe('Market Resource Integration Tests', () => {
  let client: SWCombine;

  beforeAll(() => {
    client = createTestClient();
  });

  describe('Vendors', () => {
    it('should list all public vendors', async () => {
      const response = await client.market.vendors.list();
      saveResponse('market-vendors-list', response);

      expectArray(response, 1);
      // Each vendor should have attributes with id and name
      const vendor = (response as any[])[0];
      expectFields(vendor, ['attributes', 'owner']);
    });

    it('should list vendors with pagination', async () => {
      const response = await client.market.vendors.list({ start_index: 1, item_count: 10 });
      saveResponse('market-vendors-list-paginated', response);

      expectArray(response);
      expect((response as any[]).length).toBeLessThanOrEqual(10);
    });

    it('should get specific vendor', async () => {
      const vendors = await client.market.vendors.list();
      expect((vendors as any[]).length).toBeGreaterThan(0);

      // Vendor ID is in attributes.id
      const vendorId = (vendors as any[])[0].attributes.id;
      const response = await client.market.vendors.get({ uid: String(vendorId) });
      saveResponse('market-vendor-get', response);

      // Vendor response has 'id' and 'name', not 'uid'
      expectFields(response, ['id', 'name']);
    });
  });
});
