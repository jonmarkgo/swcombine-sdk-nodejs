/**
 * Generic page wrapper for paginated API responses.
 *
 * Implements AsyncIterable so consumers can use `for await...of` to
 * transparently iterate through every item across all pages.
 */

export class Page<T> implements AsyncIterable<T> {
  readonly data: T[];
  readonly total: number;
  readonly start: number;
  readonly count: number;
  readonly hasMore: boolean;

  private _fetcher: (start: number) => Promise<Page<T>>;
  private _pageDelay: number;

  constructor(options: {
    data: T[];
    total: number;
    start: number;
    count: number;
    hasMore: boolean;
    fetcher: (start: number) => Promise<Page<T>>;
    /** Milliseconds to wait before fetching the next page. Default: 0 (no delay). */
    pageDelay?: number;
  }) {
    this.data = options.data;
    this.total = options.total;
    this.start = options.start;
    this.count = options.count;
    this.hasMore = options.hasMore;
    this._fetcher = options.fetcher;
    this._pageDelay = options.pageDelay ?? 0;
  }

  async getNextPage(): Promise<Page<T>> {
    if (!this.hasMore) throw new Error('No more pages');
    if (this._pageDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this._pageDelay));
    }
    return this._fetcher(this.start + this.count);
  }

  async *[Symbol.asyncIterator](): AsyncIterator<T> {
    yield* Page.iterateFrom(this);
  }

  private static async *iterateFrom<T>(start: Page<T>): AsyncGenerator<T> {
    let page = start;
    while (true) {
      for (const item of page.data) {
        yield item;
      }
      // Stop if no more pages, or if this page was empty (prevents infinite loop
      // if the API returns count=0 with total > 0 due to a server-side issue)
      if (!page.hasMore || page.data.length === 0) break;
      page = await page.getNextPage();
    }
  }

  toJSON() {
    return {
      data: this.data,
      total: this.total,
      start: this.start,
      count: this.count,
      hasMore: this.hasMore,
    };
  }
}
