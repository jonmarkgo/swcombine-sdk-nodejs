/**
 * Base class for all API resources
 */

import { HttpClient } from '../http/HttpClient.js';
import { Page } from '../pagination/Page.js';

/**
 * Base resource class that all API resources extend
 */
export abstract class BaseResource {
  protected http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  /**
   * Make a request to the API
   */
  protected async request<T>(method: string, path: string, data?: unknown): Promise<T> {
    switch (method.toUpperCase()) {
      case 'GET':
        return this.http.get<T>(path);
      case 'POST':
        return this.http.post<T>(path, data);
      case 'PUT':
        return this.http.put<T>(path, data);
      case 'DELETE':
        return this.http.delete<T>(path);
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  }

  /**
   * Create a Page<T> from a list response and its attributes metadata.
   *
   * @param options.data       - The array of items for this page
   * @param options.attributes - The `attributes` object from the API response (contains total, start, count)
   * @param options.defaultStart - The default start index (1 for most endpoints, 0 for Events)
   * @param options.fetcher    - A function that fetches the next page given a start index
   */
  protected createPage<T>(options: {
    data: T[];
    attributes: Record<string, unknown>;
    defaultStart: number;
    fetcher: (start: number) => Promise<Page<T>>;
    /** Milliseconds to wait before fetching the next page. Default: 0. */
    pageDelay?: number;
  }): Page<T> {
    const attrs = options.attributes ?? {};
    const total = attrs.total != null ? Number(attrs.total) : 0;
    const start = attrs.start != null ? Number(attrs.start) : options.defaultStart;
    const count = attrs.count != null ? Number(attrs.count) : options.data.length;

    // Items consumed so far = (start - startOffset) + count
    // For 1-based: (1 - 1) + 50 = 50 consumed out of total
    // For 0-based: (0 - 0) + 50 = 50 consumed out of total
    const consumed = start - options.defaultStart + count;
    const hasMore = consumed < total;

    return new Page({
      data: options.data,
      total,
      start,
      count,
      hasMore,
      fetcher: options.fetcher,
      pageDelay: options.pageDelay,
    });
  }
}
