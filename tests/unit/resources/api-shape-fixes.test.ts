import { describe, it, expect } from 'vitest';
import { FactionResource } from '../../../src/resources/FactionResource.js';
import { EventsResource } from '../../../src/resources/EventsResource.js';
import { createMockHttpClient } from '../helpers/mock-http.js';
import type { HttpClient } from '../../../src/http/HttpClient.js';

// Response shapes below are the unwrapped bodies seen live on 2026-09-27.
const ref = (uid: string, value: string) => ({
  attributes: { uid, href: `https://www.swcombine.com/ws/v2.0/character/${uid}/` },
  value,
});

describe('faction.stockholders.list()', () => {
  it('reads holders from characters.character and factions.faction', async () => {
    const http = createMockHttpClient();
    http.get.mockResolvedValue({
      attributes: { start: 1, total: 3 },
      characters: {
        character: [
          { stockholder: ref('1:1', 'A'), stocks: 7000, percentage: 70 },
          { stockholder: ref('1:2', 'B'), stocks: 2000, percentage: 20 },
        ],
      },
      factions: { faction: [{ stockholder: ref('20:9', 'F'), stocks: 1000, percentage: 10 }] },
    });
    const page = await new FactionResource(http as unknown as HttpClient).stockholders.list({
      factionId: '20:502',
    });
    expect(page.data.map((s) => s.stockholder.value)).toEqual(['A', 'B', 'F']);
    expect(page.hasMore).toBe(false);
  });

  it('handles an empty factions object', async () => {
    const http = createMockHttpClient();
    http.get.mockResolvedValue({
      attributes: { start: 1, total: 1 },
      characters: { character: [{ stockholder: ref('1:1', 'A'), stocks: 1, percentage: 100 }] },
      factions: {},
    });
    const page = await new FactionResource(http as unknown as HttpClient).stockholders.list({
      factionId: '20:502',
    });
    expect(page.data).toHaveLength(1);
  });
});

describe('events.list() pagination', () => {
  const event = (n: number) => ({
    attributes: { uid: `39:${n}`, type: 'XP' },
    time: { years: 27, days: 1, hours: 0, mins: 0, secs: 0, timestamp: '1790513336' },
    text: `event ${n}`,
  });
  // Events attributes carry no `total`.
  const attrs = (count: number) => ({
    start: 0,
    uid: '1:1',
    starttimeswc: 0,
    starttimeunix: 0,
    count,
  });

  it('reports hasMore when a full page comes back', async () => {
    const http = createMockHttpClient();
    http.get
      .mockResolvedValueOnce({ attributes: attrs(2), event: [event(1), event(2)] })
      .mockResolvedValueOnce({ attributes: { ...attrs(1), start: 2 }, event: [event(3)] });
    const events = new EventsResource(http as unknown as HttpClient);
    const page = await events.list({ eventMode: 'personal', item_count: 2 });
    expect(page.hasMore).toBe(true);

    const all = [];
    for await (const e of page) all.push(e.text);
    expect(all).toEqual(['event 1', 'event 2', 'event 3']);
    expect(http.get).toHaveBeenLastCalledWith('/events/personal', {
      params: { start_index: 2, item_count: 2 },
    });
  });

  it('stops on a short page', async () => {
    const http = createMockHttpClient();
    http.get.mockResolvedValue({ attributes: attrs(1), event: [event(1)] });
    const page = await new EventsResource(http as unknown as HttpClient).list({
      eventMode: 'personal',
      item_count: 2,
    });
    expect(page.hasMore).toBe(false);
  });
});

describe('faction.credits.get()', () => {
  it('returns the balance as a number', async () => {
    const http = createMockHttpClient();
    http.get.mockResolvedValue(1467069314);
    const credits: number = await new FactionResource(http as unknown as HttpClient).credits.get({
      factionId: '20:502',
    });
    expect(credits).toBe(1467069314);
  });
});
