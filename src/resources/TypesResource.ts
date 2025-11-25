/**
 * Types resource for accessing entity type information
 */

import { BaseResource } from './BaseResource.js';
import { Entity } from '../types/index.js';

export interface EntityType {
  name: string;
  description?: string;
  [key: string]: any;
}

export interface EntityClass {
  name: string;
  description?: string;
  [key: string]: any;
}

/**
 * Entity classes resource
 */
export class TypesClassesResource extends BaseResource {
  /**
   * Get all classes for an entity type (paginated)
   * @param options - Entity type and optional pagination parameters
   * @example
   * const classes = await client.types.classes.list({ entityType: 'vehicle' });
   * const moreClasses = await client.types.classes.list({ entityType: 'vehicle', start_index: 51, item_count: 50 });
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

    return this.http.get<EntityClass[]>(`/types/classes/${options.entityType}`, { params });
  }
}

/**
 * Entities by type resource
 */
export class TypesEntitiesResource extends BaseResource {
  /**
   * Get all entities of a type (paginated)
   * @param options - Entity type, optional class filter, and optional pagination parameters
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
      ? `/types/${options.entityType}/class/${options.class}`
      : `/types/${options.entityType}`;

    const params = {
      start_index: options.start_index || 1,
      item_count: options.item_count || 50,
    };

    return this.http.get<Entity[]>(path, { params });
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

  constructor(http: any) {
    super(http);
    this.classes = new TypesClassesResource(http);
    this.entities = new TypesEntitiesResource(http);
  }

  /**
   * Get all entity types
   */
  async listEntityTypes(): Promise<EntityType[]> {
    return this.request<EntityType[]>('GET', '/types/entitytypes');
  }
}
