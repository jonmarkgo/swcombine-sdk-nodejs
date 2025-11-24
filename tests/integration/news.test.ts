/**
 * Integration tests for News resource
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SWCombine } from '../../src/index.js';
import { createTestClient, saveResponse, delay } from './setup.js';

describe('News Resource Integration Tests', () => {
  let client: SWCombine;

  beforeAll(() => {
    client = createTestClient();
  });

  it('should list GNS news items', async () => {
    try {
      const response = await client.news.gns.list();

      console.log('GNS List Response (count):', response.length);
      if (response.length > 0) {
        console.log('First GNS item:', response[0]);
      }
      saveResponse('news-gns-list', response);

      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBe(true);
    } catch (error: any) {
      console.log('GNS List Error:', error.message, error.statusCode);
      saveResponse('news-gns-list-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  });

  it('should get specific GNS item (if any exist)', async () => {
    try {
      const items = await client.news.gns.list();

      if (items.length === 0) {
        console.log('⊘ Skipping: No GNS items available');
        return;
      }

      const itemId = items[0].uid;
      const response = await client.news.gns.get({ id: itemId });

      console.log('GNS Get Response:', response);
      saveResponse('news-gns-get', response);

      expect(response).toBeDefined();
      expect(response.uid).toBe(itemId);
    } catch (error: any) {
      console.log('GNS Get Error:', error.message, error.statusCode);
      saveResponse('news-gns-get-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  });

  it('should list SimNews items', async () => {
    try {
      const response = await client.news.simNews.list();

      console.log('SimNews List Response (count):', response.length);
      if (response.length > 0) {
        console.log('First SimNews item:', response[0]);
      }
      saveResponse('news-simnews-list', response);

      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBe(true);
    } catch (error: any) {
      console.log('SimNews List Error:', error.message, error.statusCode);
      saveResponse('news-simnews-list-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  });

  it('should get specific SimNews item (if any exist)', async () => {
    try {
      const items = await client.news.simNews.list();

      if (items.length === 0) {
        console.log('⊘ Skipping: No SimNews items available');
        return;
      }

      const itemId = items[0].uid;
      const response = await client.news.simNews.get({ id: itemId });

      console.log('SimNews Get Response:', response);
      saveResponse('news-simnews-get', response);

      expect(response).toBeDefined();
      expect(response.uid).toBe(itemId);
    } catch (error: any) {
      console.log('SimNews Get Error:', error.message, error.statusCode);
      saveResponse('news-simnews-get-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  });
});
