/**
 * Market resource for accessing vendor data
 */

import { HttpClient } from '../http/HttpClient.js';
import { BaseResource } from './BaseResource.js';
import { Page } from '../pagination/Page.js';
import { Vendor, GetVendorOptions } from '../types/index.js';

/**
 * Market vendors resource
 *
 * @see https://www.swcombine.com/ws/v2.0/documentation/market/vendors/ SW Combine API Documentation
 */
export class MarketVendorsResource extends BaseResource {
  /**
   * List all public vendors (paginated)
   * @param options - Optional pagination parameters
   * @example
   * const vendors = await client.market.vendors.list();
   * const moreVendors = await client.market.vendors.list({ start_index: 51, item_count: 50 });
   */
  async list(options?: {
    start_index?: number;
    item_count?: number;
    pageDelay?: number;
  }): Promise<Page<Vendor>> {
    const makeRequest = async (startIndex: number): Promise<Page<Vendor>> => {
      const params = {
        start_index: startIndex,
        item_count: options?.item_count ?? 50,
      };
      const response = await this.http.get<{
        vendor?: Vendor[];
        attributes?: Record<string, unknown>;
      }>('/market/vendors', { params });

      const data: Vendor[] = response.vendor ?? [];
      const attrs: Record<string, unknown> = response.attributes ?? {};

      return this.createPage({
        data,
        attributes: attrs,
        defaultStart: 1,
        fetcher: makeRequest,
        pageDelay: options?.pageDelay,
      });
    };

    return makeRequest(options?.start_index ?? 1);
  }

  /**
   * Get a specific vendor by UID.
   *
   * Returns the `Vendor` object directly — not wrapped in a `Page`.
   *
   * @returns The `Vendor` entity.
   * @example
   * const vendor = await client.market.vendors.get({ uid: 'vendor-uid' });
   * console.log(vendor.name); // access properties directly, not vendor.data
   */
  async get(options: GetVendorOptions): Promise<Vendor> {
    return this.request<Vendor>('GET', `/market/vendors/${options.uid}`);
  }
}

/**
 * Market resource for accessing market data
 *
 * @see https://www.swcombine.com/ws/v2.0/documentation/market/vendors/ SW Combine API Documentation
 */
export class MarketResource extends BaseResource {
  public readonly vendors: MarketVendorsResource;

  constructor(http: HttpClient) {
    super(http);
    this.vendors = new MarketVendorsResource(http);
  }
}
