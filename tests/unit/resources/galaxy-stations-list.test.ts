import { describe, it, expect } from 'vitest';
import { GalaxyStationsResource } from '../../../src/resources/GalaxyResource.js';
import { createMockHttpClient } from '../helpers/mock-http.js';
import type { HttpClient } from '../../../src/http/HttpClient.js';

const station = (uid: string) => ({ attributes: { uid, name: uid, href: '' } });

describe('galaxy.stations.list() start_id paging', () => {
  it('pages by start_id taken from next_page, never sending start_index', async () => {
    const http = createMockHttpClient();
    http.get
      .mockResolvedValueOnce({
        attributes: {
          start_id: 0,
          total: 2,
          count: 1,
          next_page: 'https://www.swcombine.com/ws/v2.0/galaxy/stations/?start_id=72&item_count=1',
        },
        station: [station('5:8')],
      })
      .mockResolvedValueOnce({
        attributes: { start_id: 72, total: 2, count: 1 },
        station: [station('5:72')],
      });
    const stations = new GalaxyStationsResource(http as unknown as HttpClient);

    const uids: string[] = [];
    for await (const s of await stations.list({ item_count: 1 })) {
      uids.push((s as any).attributes.uid);
    }

    expect(uids).toEqual(['5:8', '5:72']);
    expect(http.get.mock.calls.map((c) => c[1].params)).toEqual([
      { start_id: 0, item_count: 1 },
      { start_id: 72, item_count: 1 },
    ]);
  });

  it('has no next page when next_page is absent', async () => {
    const http = createMockHttpClient();
    http.get.mockResolvedValue({
      attributes: { start_id: 5, total: 1, count: 1 },
      station: [station('5:8')],
    });
    const page = await new GalaxyStationsResource(http as unknown as HttpClient).list({
      start_id: 5,
    });

    expect(page.hasMore).toBe(false);
    expect(page.start).toBe(5);
    expect(http.get.mock.calls[0][1].params).toEqual({ start_id: 5, item_count: 50 });
  });
});
