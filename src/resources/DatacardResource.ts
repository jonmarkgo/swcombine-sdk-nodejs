/**
 * Datacard resource for managing datacards
 */

import { BaseResource } from './BaseResource.js';
import { Page } from '../pagination/Page.js';
import type { EntityReference, EntityTypeRef, FactionDetailReference } from '../types/index.js';

/** Datacard row from `list()`: the entity type it produces plus the card's own UID. */
export interface DatacardListItem {
  entity: EntityTypeRef;
  attributes: { uid: string; href: string };
  [key: string]: unknown;
}

/** Where a datacard is assigned, and how many uses remain (`-1` = unlimited). */
export interface DatacardUse {
  location: EntityReference;
  locationowner: EntityReference;
  locationtype?: EntityTypeRef;
  quantity: number;
  [key: string]: unknown;
}

export interface Datacard {
  uid: string;
  entity: EntityTypeRef;
  owner: FactionDetailReference;
  assignedlocations: { assignedlocation?: DatacardUse[] } | Record<string, never>;
  generic?: string;
  [key: string]: unknown;
}

export interface DatacardAssignResult {
  assignment: {
    assigneddatacard: DatacardListItem;
    originaluse: DatacardUse;
    succeeded: boolean;
    newquantity?: number;
    [key: string]: unknown;
  }[];
}

export interface DatacardRevokeResult {
  revocation: {
    revokeddatacard: DatacardListItem;
    revokeduse: DatacardUse;
    succeeded: boolean;
    [key: string]: unknown;
  }[];
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
   * Returns a `Page<DatacardListItem>` — access the array of datacards via `.data`.
   *
   * @returns A `Page<DatacardListItem>` with `.data`, `.total`, `.hasMore`, and `.getNextPage()`.
   *
   * @example
   * ```typescript
   * const page = await client.datacard.list({ factionId: '20:123' });
   * console.log(page.data);   // DatacardListItem[] — items on this page
   * console.log(page.total);  // total datacards across all pages
   *
   * for await (const card of page) {
   *   console.log(card.entity.value); // auto-paginates
   * }
   * ```
   */
  async list(options: { factionId: string; pageDelay?: number }): Promise<Page<DatacardListItem>> {
    const makeRequest = async (_startIndex: number): Promise<Page<DatacardListItem>> => {
      const response = await this.http.get<Record<string, unknown>>(
        `/datacards/${options.factionId}`
      );

      // Extract array — find the non-attributes array key
      let data: DatacardListItem[] = [];
      let attrs: Record<string, unknown> = {};
      for (const key of Object.keys(response)) {
        if (key === 'attributes') {
          attrs = response[key] as Record<string, unknown>;
        } else if (Array.isArray(response[key])) {
          data = response[key] as DatacardListItem[];
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
   *
   * @returns The `Datacard` entity.
   *
   * @example
   * ```typescript
   * const card = await client.datacard.get({ uid: '14:6421' });
   * console.log(card.entity.value, card.assignedlocations);
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
  }): Promise<DatacardAssignResult> {
    const data: Record<string, string | number> = {
      production_entity_uid: options.production_entity_uid,
    };

    if (options.unlimited) {
      data.unlimited = 1;
    } else if (options.uses !== undefined) {
      data.uses = options.uses;
    }

    return this.request<DatacardAssignResult>('POST', `/datacard/${options.uid}`, data);
  }

  /**
   * Delete datacard assignment
   * @param options.uid - Datacard UID
   * @param options.production_entity_uid - Production entity UID to revoke from (required)
   */
  async delete(options: {
    uid: string;
    production_entity_uid: string;
  }): Promise<DatacardRevokeResult> {
    const params = {
      production_entity_uid: options.production_entity_uid,
    };
    return this.http.delete<DatacardRevokeResult>(`/datacard/${options.uid}`, { params });
  }
}
