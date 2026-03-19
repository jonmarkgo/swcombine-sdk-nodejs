import { describe, it, expect, vi } from 'vitest';
import { Page } from '../../src/pagination/Page.js';

/** Helper to create a Page with sensible defaults.
 *  hasMore can be set explicitly, otherwise it's computed assuming 0-based indexing. */
function makePage<T>(overrides: {
  data?: T[];
  total?: number;
  start?: number;
  count?: number;
  hasMore?: boolean;
  fetcher?: (start: number) => Promise<Page<T>>;
}) {
  const start = overrides.start ?? 0;
  const count = overrides.count ?? 0;
  const total = overrides.total ?? 0;
  return new Page<T>({
    data: overrides.data ?? [],
    total,
    start,
    count,
    hasMore: overrides.hasMore ?? (start + count < total),
    fetcher: overrides.fetcher ?? vi.fn(),
  });
}

describe('Page', () => {
  // ─── Constructor / hasMore ─────────────────────────────────────────

  describe('hasMore', () => {
    it('preserves hasMore=true when passed', () => {
      const page = makePage({ start: 1, count: 50, total: 100, hasMore: true });
      expect(page.hasMore).toBe(true);
    });

    it('preserves hasMore=false when passed', () => {
      const page = makePage({ start: 51, count: 50, total: 100, hasMore: false });
      expect(page.hasMore).toBe(false);
    });

    it('defaults to false when total is 0 (via helper 0-based computation)', () => {
      const page = makePage({ start: 0, count: 0, total: 0 });
      expect(page.hasMore).toBe(false);
    });

    it('defaults to true for 0-based mid-pagination (via helper)', () => {
      const page = makePage({ start: 0, count: 50, total: 100 });
      expect(page.hasMore).toBe(true);
    });

    it('defaults to false for 0-based last page (via helper)', () => {
      const page = makePage({ start: 50, count: 50, total: 100 });
      expect(page.hasMore).toBe(false);
    });
  });

  // ─── getNextPage() ────────────────────────────────────────────────

  describe('getNextPage()', () => {
    it('calls fetcher with start + count as the argument', async () => {
      const nextPage = makePage<string>({ data: ['next'], start: 51, count: 50, total: 100 });
      const fetcher = vi.fn().mockResolvedValue(nextPage);

      const page = makePage<string>({
        data: ['a', 'b'],
        start: 1,
        count: 50,
        total: 100,
        fetcher,
      });

      await page.getNextPage();
      expect(fetcher).toHaveBeenCalledWith(51); // 1 + 50
    });

    it('throws when hasMore is false', async () => {
      const page = makePage<string>({
        data: ['a'],
        start: 1,
        count: 50,
        total: 50,
        hasMore: false,
      });

      await expect(page.getNextPage()).rejects.toThrow('No more pages');
    });

    it('returns the Page from the fetcher', async () => {
      const nextPage = makePage<string>({
        data: ['x', 'y'],
        start: 51,
        count: 50,
        total: 100,
      });
      const fetcher = vi.fn().mockResolvedValue(nextPage);

      const page = makePage<string>({
        data: ['a', 'b'],
        start: 1,
        count: 50,
        total: 100,
        fetcher,
      });

      const result = await page.getNextPage();
      expect(result).toBe(nextPage);
      expect(result.data).toEqual(['x', 'y']);
    });
  });

  // ─── AsyncIterator ([Symbol.asyncIterator]) ───────────────────────

  describe('[Symbol.asyncIterator]', () => {
    it('yields all items from a single page (hasMore=false)', async () => {
      const page = makePage<number>({
        data: [1, 2, 3],
        start: 0,
        count: 3,
        total: 3,
      });

      const items: number[] = [];
      for await (const item of page) {
        items.push(item);
      }
      expect(items).toEqual([1, 2, 3]);
    });

    it('yields all items across multiple pages (chain 3 pages, 0-based)', async () => {
      // Build pages from last to first so fetchers can reference the next page

      const page3 = makePage<string>({
        data: ['g', 'h', 'i'],
        start: 6,
        count: 3,
        total: 9,
        hasMore: false,
      });

      const fetchPage3 = vi.fn().mockResolvedValue(page3);

      const page2 = makePage<string>({
        data: ['d', 'e', 'f'],
        start: 3,
        count: 3,
        total: 9,
        hasMore: true,
        fetcher: fetchPage3,
      });

      const fetchPage2 = vi.fn().mockResolvedValue(page2);

      const page1 = makePage<string>({
        data: ['a', 'b', 'c'],
        start: 0,
        count: 3,
        total: 9,
        hasMore: true,
        fetcher: fetchPage2,
      });

      const items: string[] = [];
      for await (const item of page1) {
        items.push(item);
      }
      expect(items).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']);
      expect(fetchPage2).toHaveBeenCalledWith(3); // 0 + 3
      expect(fetchPage3).toHaveBeenCalledWith(6); // 3 + 3
    });

    it('handles empty first page (data=[], hasMore=false)', async () => {
      const page = makePage<number>({
        data: [],
        start: 0,
        count: 0,
        total: 0,
      });

      const items: number[] = [];
      for await (const item of page) {
        items.push(item);
      }
      expect(items).toEqual([]);
    });

    it('does NOT infinite-loop when data is empty but hasMore would be true (safety guard)', async () => {
      // This simulates a server bug: total says there are items but the page data is empty.
      // The safety guard (page.data.length === 0) should break the loop.
      const fetcher = vi.fn();

      const page = makePage<number>({
        data: [],
        start: 0,
        count: 50,
        total: 100,
        fetcher,
        // hasMore = 0 + 50 < 100 = true, but data is empty
      });

      const items: number[] = [];
      for await (const item of page) {
        items.push(item);
      }
      expect(items).toEqual([]);
      // The fetcher should never have been called because the safety guard breaks first
      expect(fetcher).not.toHaveBeenCalled();
    });
  });

  // ─── toJSON() ─────────────────────────────────────────────────────

  describe('toJSON()', () => {
    it('returns plain object with data, total, start, count, hasMore', () => {
      const page = makePage<string>({
        data: ['a', 'b'],
        start: 0,
        count: 2,
        total: 10,
      });

      const json = page.toJSON();
      expect(json).toEqual({
        data: ['a', 'b'],
        total: 10,
        start: 0,
        count: 2,
        hasMore: true,
      });
    });

    it('does NOT include the fetcher function', () => {
      const page = makePage<string>({
        data: ['x'],
        start: 0,
        count: 1,
        total: 1,
      });

      const json = page.toJSON();
      expect(json).not.toHaveProperty('_fetcher');
      expect(json).not.toHaveProperty('fetcher');
      // Verify only expected keys are present
      expect(Object.keys(json).sort()).toEqual(['count', 'data', 'hasMore', 'start', 'total']);
    });

    it('is JSON-serializable (JSON.stringify works)', () => {
      const page = makePage<{ name: string }>({
        data: [{ name: 'Luke' }, { name: 'Leia' }],
        start: 0,
        count: 2,
        total: 5,
      });

      const serialized = JSON.stringify(page);
      const parsed = JSON.parse(serialized);

      expect(parsed).toEqual({
        data: [{ name: 'Luke' }, { name: 'Leia' }],
        total: 5,
        start: 0,
        count: 2,
        hasMore: true,
      });
    });
  });
});
