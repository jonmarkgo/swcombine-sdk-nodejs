/**
 * Integration tests for News resource
 * Tests all read-only News endpoints (GNS and SimNews)
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

describe('News Resource Integration Tests', () => {
  let client: SWCombine;

  beforeAll(() => {
    client = createTestClient();
  });

  describe('GNS (Galactic News Service)', () => {
    it('should list GNS news items', async () => {
      const response = await client.news.gns.list();
      saveResponse('news-gns-list', response);

      expectPageShape(response);
      expect(response.data.length).toBeGreaterThanOrEqual(1);
      // Each news item should have attributes with id
      const item = response.data[0];
      expectFields(item, ['attributes', 'value']);
      expectFields(item.attributes as unknown as Record<string, unknown>, ['id', 'href', 'title']);
    });

    it('should get specific GNS item', async () => {
      const page = await client.news.gns.list();
      expect(page.data.length).toBeGreaterThan(0);

      // GNS items have attributes.id, not uid
      const itemId = page.data[0].attributes.id;
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

      expectPageShape(response);
      expect(response.data.length).toBeLessThanOrEqual(10);
    });
  });

  describe('SimNews', () => {
    it('should list SimNews items', async () => {
      const response = await client.news.simNews.list();
      saveResponse('news-simnews-list', response);

      expectPageShape(response);
      // SimNews may be empty
      if (response.data.length > 0) {
        expectFields(response.data[0].attributes as unknown as Record<string, unknown>, ['id', 'href', 'title']);
      }
    });

    it('should get specific SimNews item if available', async () => {
      const page = await client.news.simNews.list();
      if (page.data.length === 0) {
        console.log('⊘ Skipping: No SimNews items available');
        return;
      }

      const itemId = page.data[0].attributes.id;
      const response = await client.news.simNews.get({ id: itemId });
      saveResponse('news-simnews-get', response);

      // SimNews detail response has 'id' and 'title', not 'uid'
      expectFields(response, ['id', 'title']);
      expectFields(response, ['author', 'faction']);
      expect(typeof (response as Record<string, unknown>).author).toBe('object');
    });
  });
});
