import { describe, it, expect } from 'vitest';
import { FactionResource } from '../../../src/resources/FactionResource.js';
import { createMockHttpClient } from '../helpers/mock-http.js';
import type { HttpClient } from '../../../src/http/HttpClient.js';

function createFactionListItem(uid: string, value: string, withSecondInCommand = true) {
  return {
    attributes: {
      uid,
      href: `https://www.swcombine.com/ws/v2.0/faction/${encodeURIComponent(value.toLowerCase())}/`,
    },
    value,
    leader: {
      attributes: {
        uid: '1:100',
        href: 'https://www.swcombine.com/ws/v2.0/character/leader/',
      },
      value: 'Leader',
    },
    secondincommand: withSecondInCommand
      ? {
          attributes: {
            uid: '1:200',
            href: 'https://www.swcombine.com/ws/v2.0/character/second/',
          },
          value: 'Second',
        }
      : {},
  };
}

describe('FactionResource', () => {
  function createResource() {
    const mockHttp = createMockHttpClient();
    const resource = new FactionResource(mockHttp as unknown as HttpClient);
    return { resource, mockHttp };
  }

  describe('list()', () => {
    it('returns the wrapped factions response with pagination metadata', async () => {
      const { resource, mockHttp } = createResource();
      mockHttp.get.mockResolvedValue({
        attributes: { start: 1, total: 317, count: 50 },
        faction: [createFactionListItem('20:445', 'Rebel Alliance', false)],
      });

      const result = await resource.list();

      expect(mockHttp.get).toHaveBeenCalledWith('/factions', {
        params: { start_index: 1, item_count: 50 },
      });
      expect(result.attributes?.total).toBe(317);
      expect(result.faction?.[0]?.value).toBe('Rebel Alliance');
      expect(result.faction?.[0]?.secondincommand).toEqual({});
    });
  });

  describe('listAll()', () => {
    it('iterates across pages using response pagination metadata', async () => {
      const { resource, mockHttp } = createResource();
      mockHttp.get
        .mockResolvedValueOnce({
          attributes: { start: 1, total: 3, count: 2 },
          faction: [
            createFactionListItem('20:445', 'Rebel Alliance', false),
            createFactionListItem('20:446', 'Merr-Sonn Technologies'),
          ],
        })
        .mockResolvedValueOnce({
          attributes: { start: 3, total: 3, count: 1 },
          faction: [createFactionListItem('20:448', 'Biotech')],
        });

      const result = await resource.listAll({ item_count: 2 });

      expect(mockHttp.get).toHaveBeenNthCalledWith(1, '/factions', {
        params: { start_index: 1, item_count: 2 },
      });
      expect(mockHttp.get).toHaveBeenNthCalledWith(2, '/factions', {
        params: { start_index: 3, item_count: 2 },
      });
      expect(result.map((faction) => faction.attributes.uid)).toEqual(['20:445', '20:446', '20:448']);
      expect(result[0].secondincommand).toEqual({});
    });

    it('stops when a page returns fewer items than requested', async () => {
      const { resource, mockHttp } = createResource();
      mockHttp.get.mockResolvedValueOnce({
        attributes: { start: 11, count: 1 },
        faction: [createFactionListItem('20:500', 'Eidola Pirates')],
      });

      const result = await resource.listAll({ start_index: 11, item_count: 2 });

      expect(mockHttp.get).toHaveBeenCalledTimes(1);
      expect(mockHttp.get).toHaveBeenCalledWith('/factions', {
        params: { start_index: 11, item_count: 2 },
      });
      expect(result).toHaveLength(1);
      expect(result[0].attributes.uid).toBe('20:500');
    });
  });

  describe('get()', () => {
    it('returns the detailed faction payload without reshaping it', async () => {
      const { resource, mockHttp } = createResource();
      const faction = {
        attributes: {
          isbasic: 'true',
        },
        uid: '20:1840',
        name: 'Unnamed Market',
        parent: {},
        description: '<p>::: This holocron is currently encrypted...</p>',
        category: 'Modular',
        colour: {
          r: 0,
          g: 0,
          b: 0,
        },
        leader: {
          attributes: {
            uid: '1:1477410',
            href: 'https://www.swcombine.com/ws/v2.0/character/lucifer%20von%20kaldreon/',
          },
          value: 'Lucifer Von Kaldreon',
        },
        secondincommand: {
          attributes: {
            uid: '1:1467702',
            href: 'https://www.swcombine.com/ws/v2.0/character/marcinius%20turelles/',
          },
          value: 'Marcinius Turelles',
        },
        founded: {
          years: 26,
          days: 120,
          hours: 10,
          mins: 51,
          secs: 3,
          timestamp: '1742925063',
        },
        ircroom: 'https://discord.gg/ZPFU52MMCg',
        homepage: 'https://unnamed.market',
        recruitmentliaisons: [],
        datacards: {},
        subfactions: {},
        modules: {
          module: [
            {
              attributes: {
                uid: '173:1',
                href: 'https://www.swcombine.com/ws/v2.0/types/faction%20modules/faction/',
              },
              value: 'Faction',
            },
          ],
        },
        images: {
          logo: 'https://custom.swcombine.com/static/20/1840-logo.png?1752687787',
          horizontalbanner: 'https://custom.swcombine.com/static/20/1840-hbanner.png?1752687881',
          verticalbanner: 'https://i.imgur.com/0l6YTAN.gif',
        },
      };

      mockHttp.get.mockResolvedValue(faction);

      const result = await resource.get({ uid: '20:1840' });

      expect(mockHttp.get).toHaveBeenCalledWith('/faction/20:1840');
      expect(result).toEqual(faction);
      expect(result.modules.module?.[0]?.attributes?.uid).toBe('173:1');
      expect(result.images.verticalbanner).toBe('https://i.imgur.com/0l6YTAN.gif');
    });
  });
});
