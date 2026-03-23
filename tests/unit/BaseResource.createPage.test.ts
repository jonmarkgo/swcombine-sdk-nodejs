import { describe, it, expect, vi } from 'vitest';
import { BaseResource } from '../../src/resources/BaseResource.js';
import { Page } from '../../src/pagination/Page.js';
import { createMockHttpClient } from './helpers/mock-http.js';
import type { HttpClient } from '../../src/http/HttpClient.js';

/**
 * Subclass that exposes the protected createPage() method for testing.
 */
class TestResource extends BaseResource {
  public testCreatePage<T>(options: {
    data: T[];
    attributes: Record<string, unknown>;
    defaultStart: number;
    fetcher: (start: number) => Promise<Page<T>>;
  }): Page<T> {
    return this.createPage<T>(options);
  }
}

function makeResource(): TestResource {
  const mockHttp = createMockHttpClient();
  return new TestResource(mockHttp as unknown as HttpClient);
}

describe('BaseResource.createPage()', () => {
  const noopFetcher = vi.fn() as (start: number) => Promise<Page<unknown>>;

  // ─── String coercion ──────────────────────────────────────────────

  it('coerces string attributes to numbers', () => {
    const resource = makeResource();
    const page = resource.testCreatePage<string>({
      data: ['a', 'b'],
      attributes: { total: '100', start: '1', count: '50' },
      defaultStart: 1,
      fetcher: noopFetcher,
    });

    expect(page.total).toBe(100);
    expect(page.start).toBe(1);
    expect(page.count).toBe(50);
  });

  // ─── Number attributes ───────────────────────────────────────────

  it('uses actual numbers when attributes are numbers', () => {
    const resource = makeResource();
    const page = resource.testCreatePage<string>({
      data: ['a'],
      attributes: { total: 200, start: 10, count: 25 },
      defaultStart: 1,
      fetcher: noopFetcher,
    });

    expect(page.total).toBe(200);
    expect(page.start).toBe(10);
    expect(page.count).toBe(25);
  });

  // ─── Fallbacks when attributes is empty {} ────────────────────────

  it('falls back total to 0 when attributes is empty {}', () => {
    const resource = makeResource();
    const page = resource.testCreatePage<string>({
      data: ['a', 'b'],
      attributes: {},
      defaultStart: 1,
      fetcher: noopFetcher,
    });

    expect(page.total).toBe(0);
  });

  it('falls back start to defaultStart when not in attributes', () => {
    const resource = makeResource();
    const page = resource.testCreatePage<string>({
      data: ['a'],
      attributes: { total: 10, count: 5 },
      defaultStart: 1,
      fetcher: noopFetcher,
    });
    expect(page.start).toBe(1);

    // Also test with defaultStart=0 (Events endpoint)
    const page0 = resource.testCreatePage<string>({
      data: ['a'],
      attributes: { total: 10, count: 5 },
      defaultStart: 0,
      fetcher: noopFetcher,
    });
    expect(page0.start).toBe(0);
  });

  it('falls back count to data.length when not in attributes', () => {
    const resource = makeResource();
    const page = resource.testCreatePage<string>({
      data: ['a', 'b', 'c'],
      attributes: { total: 10, start: 1 },
      defaultStart: 1,
      fetcher: noopFetcher,
    });

    expect(page.count).toBe(3); // data.length
  });

  // ─── Nullish coalescing: 0 values should NOT fall back ────────────

  it('handles count: 0 correctly (does NOT fall back to data.length)', () => {
    const resource = makeResource();
    const page = resource.testCreatePage<string>({
      data: ['a', 'b'],
      attributes: { total: 10, start: 1, count: 0 },
      defaultStart: 1,
      fetcher: noopFetcher,
    });

    // count=0 is not null/undefined, so the nullish check should preserve it
    expect(page.count).toBe(0);
  });

  it('handles start: 0 correctly (does NOT fall back to defaultStart)', () => {
    const resource = makeResource();
    const page = resource.testCreatePage<string>({
      data: ['a'],
      attributes: { total: 10, start: 0, count: 5 },
      defaultStart: 1, // Would be used if start were null/undefined
      fetcher: noopFetcher,
    });

    expect(page.start).toBe(0);
  });

  it('handles total: 0 correctly (does NOT fall back)', () => {
    const resource = makeResource();
    const page = resource.testCreatePage<string>({
      data: [],
      attributes: { total: 0, start: 1, count: 50 },
      defaultStart: 1,
      fetcher: noopFetcher,
    });

    expect(page.total).toBe(0);
    expect(page.hasMore).toBe(false);
  });

  // ─── attributes undefined/null ────────────────────────────────────

  it('handles attributes being undefined (should use defaults)', () => {
    const resource = makeResource();
    // The ?? {} guard in createPage handles this
    const page = resource.testCreatePage<string>({
      data: ['x', 'y'],
      attributes: undefined as unknown as Record<string, unknown>,
      defaultStart: 1,
      fetcher: noopFetcher,
    });

    expect(page.total).toBe(0);
    expect(page.start).toBe(1); // defaultStart
    expect(page.count).toBe(2); // data.length
  });

  it('handles attributes being null (should use defaults)', () => {
    const resource = makeResource();
    const page = resource.testCreatePage<string>({
      data: ['x'],
      attributes: null as unknown as Record<string, unknown>,
      defaultStart: 0,
      fetcher: noopFetcher,
    });

    expect(page.total).toBe(0);
    expect(page.start).toBe(0); // defaultStart
    expect(page.count).toBe(1); // data.length
  });

  // ─── Fetcher passthrough ──────────────────────────────────────────

  it('passes the fetcher through to the Page correctly', async () => {
    const resource = makeResource();
    const nextPage = new Page<string>({
      data: ['next'],
      total: 10,
      start: 6,
      count: 5,
      fetcher: noopFetcher,
    });
    const fetcher = vi.fn().mockResolvedValue(nextPage);

    const page = resource.testCreatePage<string>({
      data: ['a', 'b', 'c', 'd', 'e'],
      attributes: { total: 10, start: 1, count: 5 },
      defaultStart: 1,
      fetcher,
    });

    expect(page.hasMore).toBe(true);
    const result = await page.getNextPage();
    expect(fetcher).toHaveBeenCalledWith(6); // 1 + 5
    expect(result).toBe(nextPage);
  });

  // ─── Resulting Page reflects computed values ──────────────────────

  it('produces a Page with correct hasMore when data fits within total', () => {
    const resource = makeResource();
    const page = resource.testCreatePage<number>({
      data: [1, 2, 3],
      attributes: { total: '10', start: '1', count: '3' },
      defaultStart: 1,
      fetcher: noopFetcher,
    });

    expect(page.hasMore).toBe(true); // 1 + 3 < 10
    expect(page.data).toEqual([1, 2, 3]);
  });

  it('produces a Page with hasMore=false on the last page', () => {
    const resource = makeResource();
    const page = resource.testCreatePage<number>({
      data: [8, 9, 10],
      attributes: { total: '10', start: '8', count: '3' },
      defaultStart: 1,
      fetcher: noopFetcher,
    });

    expect(page.hasMore).toBe(false); // 8 + 3 >= 10
  });
});
