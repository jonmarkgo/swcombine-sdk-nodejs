/**
 * Integration tests for News resource
 * Tests all read-only News endpoints (GNS and SimNews)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SWCombine } from '../../src/index.js';
import {
  createTestClient,
  saveResponse,
  expectArray,
  expectFields,
} from './setup.js';

describe('News Resource Integration Tests', () => {
  let client: SWCombine;

  beforeAll(() => {
    client = createTestClient();
  });

  describe('GNS (Galactic News Service)', () => {
    it('should list GNS news items', async () => {
      const response = await client.news.gns.list();
      saveResponse('news-gns-list', response);

      expectArray(response, 1);
      // Each news item should have attributes with id
      const item = response[0];
      expectFields(item, ['attributes', 'value']);
    });

    it('should get specific GNS item', async () => {
      const items = await client.news.gns.list();
      expect(items.length).toBeGreaterThan(0);

      // GNS items have attributes.id, not uid
      const itemId = items[0].attributes.id;
      const response = await client.news.gns.get({ id: itemId });
      saveResponse('news-gns-get', response);

      const firstItem = Array.isArray(response) ? response[0] : response;
      // GNS detail response has 'id' and 'title', not 'uid'
      expectFields(firstItem, ['id', 'title']);
    });

    it('should list GNS with pagination', async () => {
      const response = await client.news.gns.list({ start_index: 1, item_count: 10 });
      saveResponse('news-gns-list-paginated', response);

      expectArray(response);
      expect(response.length).toBeLessThanOrEqual(10);
    });
  });

  describe('SimNews', () => {
    it('should list SimNews items', async () => {
      const response = await client.news.simNews.list();
      saveResponse('news-simnews-list', response);

      expectArray(response);
      // SimNews may be empty
    });

    it('should get specific SimNews item if available', async () => {
      const items = await client.news.simNews.list();
      if (items.length === 0) {
        console.log('⊘ Skipping: No SimNews items available');
        return;
      }

      const itemId = items[0].attributes.id;
      const response = await client.news.simNews.get({ id: itemId });
      saveResponse('news-simnews-get', response);

      const firstItem = Array.isArray(response) ? response[0] : response;
      // SimNews detail response has 'id' and 'title', not 'uid'
      expectFields(firstItem, ['id', 'title']);
    });
  });
});
