/**
 * Market resource for accessing vendor data
 */

import { HttpClient } from '../http/HttpClient.js';
import { BaseResource } from './BaseResource.js';
import { Vendor, GetVendorOptions } from '../types/index.js';

/**
 * Market vendors resource
 */
export class MarketVendorsResource extends BaseResource {
  /**
   * List all public vendors (paginated)
   * @param options - Optional pagination parameters
   * @example
   * const vendors = await client.market.vendors.list();
   * const moreVendors = await client.market.vendors.list({ start_index: 51, item_count: 50 });
   */
  async list(options?: { start_index?: number; item_count?: number }): Promise<Vendor[]> {
    const params = {
      start_index: options?.start_index || 1,
      item_count: options?.item_count || 50,
    };
    const response = await this.http.get<{ vendor?: Vendor[]; attributes?: unknown }>('/market/vendors', { params });
    // API returns { attributes: {...}, vendor: [...] }, extract just the array
    return response.vendor || [];
  }

  /**
   * Get vendor by UID
   */
  async get(options: GetVendorOptions): Promise<Vendor> {
    return this.request<Vendor>('GET', `/market/vendors/${options.uid}`);
  }
}

/**
 * Market resource for accessing market data
 */
export class MarketResource extends BaseResource {
  public readonly vendors: MarketVendorsResource;

  constructor(http: HttpClient) {
    super(http);
    this.vendors = new MarketVendorsResource(http);
  }
}
