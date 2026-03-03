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
      expectFields(item.attributes as unknown as Record<string, unknown>, ['id', 'href', 'title']);
      expectFields(response as unknown as Record<string, unknown>, ['attributes']);
    });

    it('should get specific GNS item', async () => {
      const items = await client.news.gns.list();
      expect(items.length).toBeGreaterThan(0);

      // GNS items have attributes.id, not uid
      const itemId = items[0].attributes.id;
      const response = await client.news.gns.get({ id: itemId });
      saveResponse('news-gns-get', response);

      // GNS detail response has 'id' and 'title', not 'uid'
      expectFields(response, ['id', 'title']);
      expectFields(response, ['author', 'faction']);
      expect(typeof (response as Record<string, unknown>).author).toBe('object');
    });

    it('should list GNS with pagination', async () => {
      const response = await client.news.gns.list({ start_index: 1, item_count: 10 });
      saveResponse('news-gns-list-paginated', response);

      expectArray(response);
      expect(response.length).toBeLessThanOrEqual(10);
      expectFields(response as unknown as Record<string, unknown>, ['attributes']);
    });
  });

  describe('SimNews', () => {
    it('should list SimNews items', async () => {
      const response = await client.news.simNews.list();
      saveResponse('news-simnews-list', response);

      expectArray(response);
      // SimNews may be empty
      expectFields(response as unknown as Record<string, unknown>, ['attributes']);
      if (response.length > 0) {
        expectFields(response[0].attributes as unknown as Record<string, unknown>, ['id', 'href', 'title']);
      }
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

      // SimNews detail response has 'id' and 'title', not 'uid'
      expectFields(response, ['id', 'title']);
      expectFields(response, ['author', 'faction']);
      expect(typeof (response as Record<string, unknown>).author).toBe('object');
    });
  });
});
