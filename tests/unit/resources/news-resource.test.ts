import { describe, it, expect } from 'vitest';
import { GNSResource, SimNewsResource } from '../../../src/resources/NewsResource.js';
import { createMockHttpClient } from '../helpers/mock-http.js';
import type { HttpClient } from '../../../src/http/HttpClient.js';

describe('NewsResource', () => {
  function createGnsResource() {
    const mockHttp = createMockHttpClient();
    const resource = new GNSResource(mockHttp as unknown as HttpClient);
    return { resource, mockHttp };
  }

  function createSimNewsResource() {
    const mockHttp = createMockHttpClient();
    const resource = new SimNewsResource(mockHttp as unknown as HttpClient);
    return { resource, mockHttp };
  }

  describe('GNSResource.get()', () => {
    it('normalizes flash string author and empty faction to object references', async () => {
      const { resource, mockHttp } = createGnsResource();
      mockHttp.get.mockResolvedValue({
        url: 'https://www.swcombine.com/community/news/gnsnews.php',
        title: 'New leader appointed for Zann Consortium!',
        id: 49100,
        author: 'Galactic News Reporter',
        faction: {},
      });

      const result = await resource.get({ id: 49100 });
      expect(mockHttp.get).toHaveBeenCalledWith('/news/gns/49100');
      expect(result.author.value).toBe('Galactic News Reporter');
      expect(result.faction.value).toBe('');
    });

    it('normalizes array responses and keeps object author references', async () => {
      const { resource, mockHttp } = createGnsResource();
      mockHttp.get.mockResolvedValue([
        {
          url: 'https://www.swcombine.com/community/news/gnsnews.php?postID=49108',
          title: 'Black Sun Peacekeepers Restore Order at Maw Installation',
          id: 49108,
          author: {
            attributes: {
              uid: '1:1481849',
              href: 'https://www.swcombine.com/ws/v2.0/character/gwendoline%20von%20nex/',
            },
            value: 'Gwendoline von Nex',
          },
          faction: {
            attributes: {
              uid: '20:449',
              href: 'https://www.swcombine.com/ws/v2.0/faction/black%20sun/',
            },
            value: 'Black Sun',
          },
        },
      ]);

      const result = await resource.get({ id: 49108 });
      expect(result.author.value).toBe('Gwendoline von Nex');
      expect(result.faction.value).toBe('Black Sun');
    });
  });

  describe('GNSResource.list()', () => {
    it('returns array items with list pagination attributes', async () => {
      const { resource, mockHttp } = createGnsResource();
      mockHttp.get.mockResolvedValue({
        attributes: { start: '1', total: '200', count: '50' },
        newsitem: [
          {
            attributes: {
              id: 49108,
              href: 'https://www.swcombine.com/ws/v2.0/news/gns/49108/',
            },
            value: 'Headline',
          },
        ],
      });

      const result = await resource.list();
      expect(mockHttp.get).toHaveBeenCalledWith('/news/gns', {
        params: { start_index: 1, item_count: 50 },
      });
      expect(result.data.length).toBe(1);
      expect(result.data[0].attributes.id).toBe(49108);
      expect(result.data[0].attributes.title).toBe('Headline');
      expect(result.start).toBe(1);
      expect(result.total).toBe(200);
      expect(result.count).toBe(50);
    });
  });

  describe('SimNewsResource.get()', () => {
    it('normalizes flash string author into object reference', async () => {
      const { resource, mockHttp } = createSimNewsResource();
      mockHttp.get.mockResolvedValue({
        url: 'https://www.swcombine.com/community/news/gnsnews.php',
        title: 'Quick News Entry',
        id: 10,
        author: 'Galactic News Reporter',
        faction: {},
      });

      const result = await resource.get({ id: 10 });
      expect(mockHttp.get).toHaveBeenCalledWith('/news/simnews/10');
      expect(result.author.value).toBe('Galactic News Reporter');
      expect(result.faction.value).toBe('');
    });
  });

  describe('SimNewsResource.list()', () => {
    it('returns array items with list pagination attributes', async () => {
      const { resource, mockHttp } = createSimNewsResource();
      mockHttp.get.mockResolvedValue({
        attributes: { start: 10, total: 42, count: 10 },
        newsitem: [],
      });

      const result = await resource.list({ start_index: 10, item_count: 10 });
      expect(mockHttp.get).toHaveBeenCalledWith('/news/simnews', {
        params: { start_index: 10, item_count: 10 },
      });
      expect(result.data.length).toBe(0);
      expect(result.start).toBe(10);
      expect(result.total).toBe(42);
      expect(result.count).toBe(10);
    });
  });
});
