/**
 * Inventory resource for managing entities
 */

import { HttpClient } from '../http/HttpClient.js';
import { BaseResource } from './BaseResource.js';
import { Page } from '../pagination/Page.js';
import {
  Entity,
  GetEntityOptions,
  InventoryEntityType,
  InventoryEntityTypeMap,
  ListInventoryEntitiesOptions,
  QueryParams,
} from '../types/index.js';

/**
 * Inventory entities resource
 *
 * @see https://www.swcombine.com/ws/v2.0/documentation/inventory/uid/entity_type/assign_type/ SW Combine API Documentation
 */
export class InventoryEntitiesResource extends BaseResource {
  /**
   * List entities in inventory (paginated with optional filtering)
   *
   * Supports filtering by various entity properties. Filter arrays must have matching lengths.
   *
   * @param options - Inventory UID, entity type, assign type, and optional pagination/filtering parameters
   * @param options.uid - Character or Faction UID
   * @param options.entityType - Entity type: 'ships', 'vehicles', 'stations', 'cities', 'facilities', 'planets', 'items', 'npcs', 'droids', 'creatures', or 'materials'
   * @param options.assignType - Assignment type: 'owner', 'commander', or 'pilot'
   * @param options.start_index - Starting position (1-based). Default: 1
   * @param options.item_count - Number of items to retrieve. Default: 50, Max: 200
   * @param options.filter_type - Array of filter types (e.g., 'class', 'name', 'tags', 'powered')
   * @param options.filter_value - Array of values corresponding to each filter type
   * @param options.filter_inclusion - Array specifying 'includes' or 'excludes' for each filter
   * @example
   * const entities = await client.inventory.entities.list({ uid: '1:12345', entityType: 'vehicle', assignType: 'pilot' });
   * // Fetch up to 200 entities at once
   * const moreEntities = await client.inventory.entities.list({ uid: '1:12345', entityType: 'vehicle', assignType: 'pilot', start_index: 1, item_count: 200 });
   * // Filter by multiple criteria
   * const multiFiltered = await client.inventory.entities.list({
   *   uid: '1:12345',
   *   entityType: 'ships',
   *   assignType: 'owner',
   *   filter_type: ['class', 'powered'],
   *   filter_value: ['Fighter', '1'],
   *   filter_inclusion: ['includes', 'includes']
   * });
   */
  async list<T extends InventoryEntityType>(
    options: ListInventoryEntitiesOptions<T>
  ): Promise<Page<InventoryEntityTypeMap[T]>> {
    const makeRequest = async (startIndex: number): Promise<Page<InventoryEntityTypeMap[T]>> => {
      const params: QueryParams = {
        start_index: startIndex,
        item_count: options.item_count ?? 50,
      };

      // Add filtering parameters if provided
      if (options.filter_type) {
        params.filter_type = options.filter_type;
      }
      if (options.filter_value) {
        params.filter_value = options.filter_value;
      }
      if (options.filter_inclusion) {
        params.filter_inclusion = options.filter_inclusion;
      }

      const response = await this.http.get<Record<string, unknown>>(
        `/inventory/${options.uid}/${options.entityType}/${options.assignType}`,
        { params }
      );

      // API returns { filters: {...}, entities: { attributes: {...}, entity: [...] } }
      const entities = response.entities as Record<string, unknown> | undefined;
      const data = (entities && Array.isArray(entities.entity)
        ? entities.entity
        : []) as InventoryEntityTypeMap[T][];
      const attrs = (entities?.attributes || {}) as Record<string, unknown>;

      return this.createPage({
        data,
        attributes: attrs,
        defaultStart: 1,
        fetcher: makeRequest,
      });
    };

    return makeRequest(options.start_index ?? 1);
  }

  /**
   * Get specific entity
   */
  async get(options: GetEntityOptions): Promise<Entity> {
    return this.request<Entity>('GET', `/inventory/${options.entityType}/${options.uid}`);
  }

  /**
   * Update entity property
   * @param options.entityType - Entity type (ships, vehicles, stations, etc.)
   * @param options.uid - Entity UID
   * @param options.property - Property to update
   * @param options.new_value - New value for the property
   * @param options.reason - Optional reason for the change
   */
  async updateProperty(options: {
    entityType: string;
    uid: string;
    property:
      | 'name'
      | 'open-to'
      | 'owner'
      | 'commander'
      | 'pilot'
      | 'infotext'
      | 'action'
      | 'crewlist-add'
      | 'crewlist-remove'
      | 'crewlist-clear';
    new_value: string;
    reason?: string;
  }): Promise<Entity> {
    const data: any = {
      new_value: options.new_value,
    };
    if (options.reason) {
      data.reason = options.reason;
    }

    return this.request<Entity>(
      'POST',
      `/inventory/${options.entityType}/${options.uid}/${options.property}/`,
      data
    );
  }

  /**
   * Add tag to entity
   */
  async addTag(options: { entityType: string; uid: string; tag: string }): Promise<void> {
    return this.request<void>(
      'PUT',
      `/inventory/${options.entityType}/${options.uid}/tag/${options.tag}`
    );
  }

  /**
   * Remove tag from entity
   */
  async removeTag(options: { entityType: string; uid: string; tag: string }): Promise<void> {
    return this.request<void>(
      'DELETE',
      `/inventory/${options.entityType}/${options.uid}/tag/${options.tag}`
    );
  }

  /**
   * Remove all tags from entity
   */
  async removeAllTags(options: { entityType: string; uid: string }): Promise<void> {
    return this.request<void>('DELETE', `/inventory/${options.entityType}/${options.uid}/tags`);
  }
}

/**
 * Inventory resource for managing inventories
 *
 * @see https://www.swcombine.com/ws/v2.0/documentation/inventory/uid/ SW Combine API Documentation
 */
export class InventoryResource extends BaseResource {
  public readonly entities: InventoryEntitiesResource;

  constructor(http: HttpClient) {
    super(http);
    this.entities = new InventoryEntitiesResource(http);
  }

  /**
   * Get inventory by UID
   */
  async get(options: { uid: string }): Promise<any> {
    return this.request<any>('GET', `/inventory/${options.uid}`);
  }
}
