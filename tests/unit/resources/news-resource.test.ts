import { describe, it, expect } from 'vitest';
import { GNSResource, SimNewsResource } from '../../../src/resources/NewsResource.js';
import { createMockHttpClient } from '../helpers/mock-http.js';
import type { HttpClient } from '../../../src/http/HttpClient.js';
import type { NewsItem } from '../../../src/types/index.js';

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
      expect(Array.isArray(result)).toBe(false);

      const post = result as NewsItem;
      expect(post.author.value).toBe('Galactic News Reporter');
      expect(post.faction.value).toBe('');
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
      expect(Array.isArray(result)).toBe(true);
      const posts = result as NewsItem[];
      expect(posts[0].author.value).toBe('Gwendoline von Nex');
      expect(posts[0].faction.value).toBe('Black Sun');
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
      expect(Array.isArray(result)).toBe(false);

      const post = result as NewsItem;
      expect(post.author.value).toBe('Galactic News Reporter');
      expect(post.faction.value).toBe('');
    });
  });
});
