/**
 * Integration tests for Market resource
 * Tests all read-only Market endpoints
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SWCombine } from '../../src/index.js';
import {
  createTestClient,
  saveResponse,
  expectFields,
} from './setup.js';

function expectPageShape(response: unknown): void {
  expect(response).toBeDefined();
  expect(typeof response).toBe('object');
  expect(response).not.toBeNull();
  expectFields(response, ['data', 'total', 'start', 'count', 'hasMore']);
}

describe('Market Resource Integration Tests', () => {
  let client: SWCombine;

  beforeAll(() => {
    client = createTestClient();
  });

  describe('Vendors', () => {
    it('should list all public vendors', async () => {
      const response = await client.market.vendors.list();
      saveResponse('market-vendors-list', response);

      expectPageShape(response);
      expect(response.data.length).toBeGreaterThanOrEqual(1);
      // Each vendor should have attributes with id and name
      const vendor = response.data[0];
      expectFields(vendor, ['attributes', 'owner']);
    });

    it('should list vendors with pagination', async () => {
      const response = await client.market.vendors.list({ start_index: 1, item_count: 10 });
      saveResponse('market-vendors-list-paginated', response);

      expectPageShape(response);
      expect(response.data.length).toBeLessThanOrEqual(10);
    });

    it('should get specific vendor', async () => {
      const vendors = await client.market.vendors.list();
      expect(vendors.data.length).toBeGreaterThan(0);

      // Vendor ID is in attributes.id
      const vendorId = (vendors.data[0] as any).attributes.id;
      const response = await client.market.vendors.get({ uid: String(vendorId) });
      saveResponse('market-vendor-get', response);

      // Vendor response has 'id' and 'name', not 'uid'
      expectFields(response, ['id', 'name']);
    });
  });
});
