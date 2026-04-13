/**
 * Datacard resource for managing datacards
 */

import { BaseResource } from './BaseResource.js';
import { Page } from '../pagination/Page.js';

export interface Datacard {
  uid: string;
  name?: string;
  description?: string;
  [key: string]: unknown;
}

/**
 * Datacard resource for managing datacards
 *
 * @see https://www.swcombine.com/ws/v2.0/documentation/datacard/uid/ SW Combine API Documentation
 */
export class DatacardResource extends BaseResource {
  /**
   * List datacards owned by faction.
   *
   * Returns a `Page<Datacard>` — access the array of datacards via `.data`.
   *
   * @returns A `Page<Datacard>` with `.data`, `.total`, `.hasMore`, and `.getNextPage()`.
   *
   * @example
   * ```typescript
   * const page = await client.datacard.list({ factionId: '20:123' });
   * console.log(page.data);   // Datacard[] — items on this page
   * console.log(page.total);  // total datacards across all pages
   *
   * for await (const card of page) {
   *   console.log(card.name); // auto-paginates
   * }
   * ```
   */
  async list(options: { factionId: string; pageDelay?: number }): Promise<Page<Datacard>> {
    const makeRequest = async (_startIndex: number): Promise<Page<Datacard>> => {
      const response = await this.http.get<Record<string, unknown>>(
        `/datacards/${options.factionId}`
      );

      // Extract array — find the non-attributes array key
      let data: Datacard[] = [];
      let attrs: Record<string, unknown> = {};
      for (const key of Object.keys(response)) {
        if (key === 'attributes') {
          attrs = response[key] as Record<string, unknown>;
        } else if (Array.isArray(response[key])) {
          data = response[key] as Datacard[];
        }
      }

      return this.createPage({
        data,
        attributes: attrs,
        defaultStart: 1,
        fetcher: makeRequest,
        pageDelay: options.pageDelay,
      });
    };

    return makeRequest(1);
  }

  /**
   * Get a specific datacard by UID.
   *
   * Returns the `Datacard` object directly — not wrapped in a `Page`.
   * Access properties like `.name` and `.uid` on the result itself.
   *
   * @returns The `Datacard` entity.
   *
   * @example
   * ```typescript
   * const card = await client.datacard.get({ uid: 'datacard-uid' });
   * console.log(card.name); // access properties directly, not card.data
   * ```
   */
  async get(options: { uid: string }): Promise<Datacard> {
    return this.request<Datacard>('GET', `/datacard/${options.uid}`);
  }

  /**
   * Create/assign datacard to production entity
   * @param options.uid - Datacard UID
   * @param options.production_entity_uid - The entity UID to assign this datacard to
   * @param options.uses - Number of uses (optional, use this OR unlimited)
   * @param options.unlimited - Set to true for unlimited uses (optional, use this OR uses)
   */
  async create(options: {
    uid: string;
    production_entity_uid: string;
    uses?: number;
    unlimited?: boolean;
  }): Promise<Datacard> {
    const data: Record<string, string | number> = {
      production_entity_uid: options.production_entity_uid,
    };

    if (options.unlimited) {
      data.unlimited = 1;
    } else if (options.uses !== undefined) {
      data.uses = options.uses;
    }

    return this.request<Datacard>('POST', `/datacard/${options.uid}`, data);
  }

  /**
   * Delete datacard assignment
   * @param options.uid - Datacard UID
   * @param options.production_entity_uid - Production entity UID to revoke from (required)
   */
  async delete(options: { uid: string; production_entity_uid: string }): Promise<void> {
    const params = {
      production_entity_uid: options.production_entity_uid,
    };
    return this.http.delete<void>(`/datacard/${options.uid}`, { params });
  }
}
