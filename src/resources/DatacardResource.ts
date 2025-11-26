/**
 * Datacard resource for managing datacards
 */

import { BaseResource } from './BaseResource.js';

export interface Datacard {
  uid: string;
  name?: string;
  description?: string;
  [key: string]: unknown;
}

/**
 * Datacard resource for managing datacards
 */
export class DatacardResource extends BaseResource {
  /**
   * List datacards owned by faction
   */
  async list(options: { factionId: string }): Promise<Datacard[]> {
    const response = await this.http.get<Record<string, unknown>>(`/datacards/${options.factionId}`);
    // API returns { attributes: {...}, datacard: [...] }, extract just the array
    for (const key of Object.keys(response)) {
      if (key !== 'attributes' && Array.isArray(response[key])) {
        return response[key] as Datacard[];
      }
    }
    return [];
  }

  /**
   * Get specific datacard
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
    const data: any = {
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
