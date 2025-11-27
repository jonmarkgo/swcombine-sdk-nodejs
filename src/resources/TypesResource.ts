/**
 * Types resource for accessing entity type information
 */

import { HttpClient } from '../http/HttpClient.js';
import { BaseResource } from './BaseResource.js';
import { Entity } from '../types/index.js';

export interface EntityType {
  name: string;
  description?: string;
  [key: string]: unknown;
}

export interface EntityClass {
  name: string;
  description?: string;
  [key: string]: unknown;
}

/**
 * Entity classes resource
 */
export class TypesClassesResource extends BaseResource {
  /**
   * Get all classes for a specific entity type (paginated)
   *
   * NOTE: Official API documentation states "Query String: N/A" and "Parameters: N/A",
   * but empirical testing suggests pagination parameters may be required to avoid 404 errors.
   * The SDK includes pagination parameters by default for safety.
   *
   * @param options - Entity type (plural, e.g., 'vehicles', 'ships') and optional pagination parameters
   * @example
   * const classes = await client.types.classes.list({ entityType: 'vehicles' });
   * const moreClasses = await client.types.classes.list({ entityType: 'vehicles', start_index: 51, item_count: 50 });
   */
  async list(options: {
    entityType: string;
    start_index?: number;
    item_count?: number;
  }): Promise<EntityClass[]> {
    const params = {
      start_index: options.start_index || 1,
      item_count: options.item_count || 50,
    };

    const response = await this.http.get<Record<string, unknown>>(`/types/classes/${options.entityType}`, { params });
    // API returns { swcapi: { classes: { vehicles: { attributes: {...}, class: [...] } } } }
    // HttpClient unwraps swcapi.classes, so we get { vehicles: { attributes: {...}, class: [...] } }
    // Extract the class array from the entity type object
    const entityTypeData = response[options.entityType] as Record<string, unknown> | undefined;
    if (entityTypeData && Array.isArray(entityTypeData.class)) {
      return entityTypeData.class as EntityClass[];
    }
    // Fallback: look for any array in the response
    for (const key of Object.keys(response)) {
      if (key !== 'attributes' && Array.isArray(response[key])) {
        return response[key] as EntityClass[];
      }
    }
    return [];
  }
}

/**
 * Entities by type resource
 */
export class TypesEntitiesResource extends BaseResource {
  /**
   * Get all entities of a type (paginated)
   * @param options - Entity type (plural, e.g., 'vehicles', 'ships'), optional class filter, and optional pagination parameters
   * @example
   * const ships = await client.types.entities.list({ entityType: 'ships' });
   * const moreShips = await client.types.entities.list({ entityType: 'ships', start_index: 51, item_count: 50 });
   * const fighters = await client.types.entities.list({ entityType: 'ships', class: 'fighter', start_index: 1, item_count: 50 });
   */
  async list(options: {
    entityType: string;
    class?: string;
    start_index?: number;
    item_count?: number;
  }): Promise<Entity[]> {
    const path = options.class
      ? `/types/${options.entityType}/class/${options.class}/`
      : `/types/${options.entityType}/`;

    const params = {
      start_index: options.start_index || 1,
      item_count: options.item_count || 50,
    };

    const response = await this.http.get<Record<string, unknown>>(path, { params });
    // API returns { swcapi: { shiptypes: { attributes: {...}, shiptype: [...] } } }
    // HttpClient unwraps swcapi AND the first key (shiptypes), so we get { attributes: {...}, shiptype: [...] }
    // The array key is singular (e.g., shiptype, vehicletype)
    const arrayKey = options.entityType.slice(0, -1) + 'type'; // ships -> shiptype
    if (Array.isArray(response[arrayKey])) {
      return response[arrayKey] as Entity[];
    }
    // Fallback: look for any array in the response (excluding 'attributes')
    for (const key of Object.keys(response)) {
      if (key !== 'attributes' && Array.isArray(response[key])) {
        return response[key] as Entity[];
      }
    }
    return [];
  }

  /**
   * Get specific entity type information
   */
  async get(options: { entityType: string; uid: string }): Promise<Entity> {
    return this.request<Entity>('GET', `/types/${options.entityType}/${options.uid}`);
  }
}

/**
 * Types resource for accessing type information
 */
export class TypesResource extends BaseResource {
  public readonly classes: TypesClassesResource;
  public readonly entities: TypesEntitiesResource;

  constructor(http: HttpClient) {
    super(http);
    this.classes = new TypesClassesResource(http);
    this.entities = new TypesEntitiesResource(http);
  }

  /**
   * Get all entity types
   */
  async listEntityTypes(): Promise<EntityType[]> {
    const response = await this.http.get<Record<string, unknown>>('/types/entitytypes');
    // API returns { entitytype: [...], count: 76 }, extract just the array
    if (response.entitytype && Array.isArray(response.entitytype)) {
      return response.entitytype as EntityType[];
    }
    // Fallback: find any array in the response
    for (const key of Object.keys(response)) {
      if (Array.isArray(response[key])) {
        return response[key] as EntityType[];
      }
    }
    return [];
  }
}
