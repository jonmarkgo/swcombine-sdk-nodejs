/**
 * Types resource for accessing entity type information
 */

import { HttpClient } from '../http/HttpClient.js';
import { Page } from '../pagination/Page.js';
import { BaseResource } from './BaseResource.js';
import {
  GetTypesEntityOptions,
  ListTypesEntitiesOptions,
  TypesEntityGetResponseMap,
  TypesEntityListItem,
  TypesEntityType,
} from '../types/index.js';

function getTypesEntityPathSegment(entityType: TypesEntityType): string {
  // API expects "faction modules" in the URL path, while SDK uses the canonical "factionmodules" token.
  if (entityType === 'factionmodules') {
    return 'faction modules';
  }
  return entityType;
}

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
 *
 * @see https://www.swcombine.com/ws/v2.0/documentation/types/classes/entity_type/ SW Combine API Documentation
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
    entityType: TypesEntityType;
    start_index?: number;
    item_count?: number;
    pageDelay?: number;
  }): Promise<Page<EntityClass>> {
    const makeRequest = async (startIndex: number): Promise<Page<EntityClass>> => {
      const params = { start_index: startIndex, item_count: options.item_count ?? 50 };
      const response = await this.http.get<Record<string, unknown>>(
        `/types/classes/${getTypesEntityPathSegment(options.entityType)}`,
        { params }
      );

      // API returns { swcapi: { classes: { vehicles: { attributes: {...}, class: [...] } } } }
      // HttpClient unwraps swcapi.classes, so we get { vehicles: { attributes: {...}, class: [...] } }
      // Attributes are nested inside response[entityType], NOT at the top level.
      const entityTypeData = response[options.entityType] as Record<string, unknown> | undefined;
      let data: EntityClass[] = [];
      let attrs: Record<string, unknown> = {};

      if (entityTypeData) {
        if (Array.isArray(entityTypeData.class)) {
          data = entityTypeData.class as EntityClass[];
        }
        attrs = (entityTypeData.attributes ?? {}) as Record<string, unknown>;
      } else {
        // Fallback: look for any array in the response
        for (const key of Object.keys(response)) {
          if (key !== 'attributes' && Array.isArray(response[key])) {
            data = response[key] as EntityClass[];
            break;
          }
        }
        attrs = (response.attributes ?? {}) as Record<string, unknown>;
      }

      return this.createPage({
        data,
        attributes: attrs,
        defaultStart: 1,
        fetcher: makeRequest,
        pageDelay: options.pageDelay,
      });
    };

    return makeRequest(options.start_index ?? 1);
  }
}

/**
 * Entities by type resource
 *
 * @see https://www.swcombine.com/ws/v2.0/documentation/types/entity_type/ SW Combine API Documentation
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
  async list<T extends TypesEntityType>(
    options: ListTypesEntitiesOptions<T>
  ): Promise<Page<TypesEntityListItem>> {
    const makeRequest = async (startIndex: number): Promise<Page<TypesEntityListItem>> => {
      const entityPath = getTypesEntityPathSegment(options.entityType);
      const path = options.class
        ? `/types/${entityPath}/class/${options.class}/`
        : `/types/${entityPath}/`;
      const params = { start_index: startIndex, item_count: options.item_count ?? 50 };

      const response = await this.http.get<Record<string, unknown>>(path, { params });
      const data = this.extractEntityArrayForType(response, options.entityType);
      const attrs = (response.attributes ?? {}) as Record<string, unknown>;

      return this.createPage({
        data,
        attributes: attrs,
        defaultStart: 1,
        fetcher: makeRequest,
        pageDelay: options.pageDelay,
      });
    };

    return makeRequest(options.start_index ?? 1);
  }

  /**
   * Get specific entity type information by category and UID.
   *
   * Returns the entity type object directly — not wrapped in a `Page`.
   *
   * @returns The entity type detail (e.g. `TypesShipEntity`, `TypesVehicleEntity`, etc.).
   * @example
   * const shipType = await client.types.entities.get({ entityType: 'ships', uid: '8:7' });
   * console.log(shipType.name); // access properties directly, not shipType.data
   */
  async get<T extends TypesEntityType>(
    options: GetTypesEntityOptions<T>
  ): Promise<TypesEntityGetResponseMap[T]> {
    const entityPath = getTypesEntityPathSegment(options.entityType);
    return this.request<TypesEntityGetResponseMap[T]>('GET', `/types/${entityPath}/${options.uid}`);
  }

  private extractEntityArrayForType(
    response: Record<string, unknown>,
    entityType: TypesEntityType
  ): TypesEntityListItem[] {
    // Prefer explicit ships array key when available.
    if (entityType === 'ships') {
      const shipTypes = response.shiptype;
      if (Array.isArray(shipTypes)) {
        return shipTypes as TypesEntityListItem[];
      }
    }

    // Prefer explicit vehicles array key when available.
    if (entityType === 'vehicles') {
      const vehicleTypes = response.vehicletype;
      if (Array.isArray(vehicleTypes)) {
        return vehicleTypes as TypesEntityListItem[];
      }
    }

    // Prefer explicit creatures array key when available.
    if (entityType === 'creatures') {
      const creatureTypes = response.creaturetype;
      if (Array.isArray(creatureTypes)) {
        return creatureTypes as TypesEntityListItem[];
      }
    }

    // Prefer explicit faction module array key when available.
    if (entityType === 'factionmodules') {
      const factionModuleTypes = response['faction moduletype'];
      if (Array.isArray(factionModuleTypes)) {
        return factionModuleTypes as TypesEntityListItem[];
      }
    }

    // Prefer explicit terrain array key when available.
    if (entityType === 'terrain') {
      const terrainTypes = response.terraintype;
      if (Array.isArray(terrainTypes)) {
        return terrainTypes as TypesEntityListItem[];
      }
    }

    // Prefer explicit planet array key when available.
    if (entityType === 'planets') {
      const planetTypes = response.planettype;
      if (Array.isArray(planetTypes)) {
        return planetTypes as TypesEntityListItem[];
      }
    }

    // Prefer explicit weapon array key when available.
    if (entityType === 'weapons') {
      const weaponTypes = response.weapontype;
      if (Array.isArray(weaponTypes)) {
        return weaponTypes as TypesEntityListItem[];
      }
    }

    // Prefer explicit race array key when available.
    if (entityType === 'races') {
      const raceTypes = response.race;
      if (Array.isArray(raceTypes)) {
        return raceTypes as TypesEntityListItem[];
      }
    }

    // Prefer explicit material array key when available.
    if (entityType === 'materials') {
      const materialTypes = response.materialtype;
      if (Array.isArray(materialTypes)) {
        return materialTypes as TypesEntityListItem[];
      }
    }

    // Prefer explicit droid array key when available.
    if (entityType === 'droids') {
      const droidTypes = response.droidtype;
      if (Array.isArray(droidTypes)) {
        return droidTypes as TypesEntityListItem[];
      }
    }

    // Prefer explicit NPC array key when available.
    if (entityType === 'npcs') {
      const npcTypes = response.npctype;
      if (Array.isArray(npcTypes)) {
        return npcTypes as TypesEntityListItem[];
      }
    }

    // Prefer explicit item array key when available.
    if (entityType === 'items') {
      const itemTypes = response.itemtype;
      if (Array.isArray(itemTypes)) {
        return itemTypes as TypesEntityListItem[];
      }
    }

    // Prefer explicit facility array key when available.
    if (entityType === 'facilities') {
      const facilityTypes = response.facilitytype;
      if (Array.isArray(facilityTypes)) {
        return facilityTypes as TypesEntityListItem[];
      }
    }

    // Prefer explicit station array key when available.
    if (entityType === 'stations') {
      const stationTypes = response.stationtype;
      if (Array.isArray(stationTypes)) {
        return stationTypes as TypesEntityListItem[];
      }
    }

    return this.extractEntityArray(response);
  }

  private extractEntityArray(response: Record<string, unknown>): TypesEntityListItem[] {
    for (const key of Object.keys(response)) {
      if (key === 'attributes') {
        continue;
      }
      const value = response[key];
      if (Array.isArray(value)) {
        return value as TypesEntityListItem[];
      }
    }
    return [];
  }
}

/**
 * Types resource for accessing type information
 *
 * @see https://www.swcombine.com/ws/v2.0/documentation/types/entitytypes/ SW Combine API Documentation
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
