/**
 * Types resource for accessing entity type information
 */

import { HttpClient } from '../http/HttpClient.js';
import { BaseResource } from './BaseResource.js';
import {
  GetTypesEntityOptions,
  ListTypesClassesOptions,
  ListTypesEntitiesOptions,
  TypesEntitiesListMetaResponse,
  TypesEntitiesListRawResponse,
  TypesEntityGetResponseMap,
  TypesEntityListItem,
  TypesEntityType,
  TypesShipsListRawResponse,
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
  async list<T extends TypesEntityType>(
    options: ListTypesClassesOptions<T>
  ): Promise<EntityClass[]> {
    const params = {
      start_index: options.start_index || 1,
      item_count: options.item_count || 50,
    };

    const response = await this.http.get<Record<string, unknown>>(
      `/types/classes/${getTypesEntityPathSegment(options.entityType)}`,
      { params }
    );
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
  async list<T extends TypesEntityType>(
    options: ListTypesEntitiesOptions<T>
  ): Promise<TypesEntityListItem[]> {
    const response = await this.listRaw(options);
    return response.items;
  }

  /**
   * Get normalized entities list response for a type (paginated)
   * Example shape: { attributes: {...}, items: [...] }
   */
  async listRaw<T extends TypesEntityType>(
    options: ListTypesEntitiesOptions<T>
  ): Promise<TypesEntitiesListMetaResponse> {
    const entityPath = getTypesEntityPathSegment(options.entityType);
    const path = options.class
      ? `/types/${entityPath}/class/${options.class}/`
      : `/types/${entityPath}/`;

    const params = {
      start_index: options.start_index || 1,
      item_count: options.item_count || 50,
    };

    const payload = (await this.http.get<Record<string, unknown>>(path, {
      params,
    })) as TypesEntitiesListRawResponse;

    return {
      attributes: payload.attributes,
      items: this.extractEntityArrayForType(payload, options.entityType),
    };
  }

  /**
   * Get specific entity type information
   */
  async get<T extends TypesEntityType>(
    options: GetTypesEntityOptions<T>
  ): Promise<TypesEntityGetResponseMap[T]> {
    const entityPath = getTypesEntityPathSegment(options.entityType);
    return this.request<TypesEntityGetResponseMap[T]>('GET', `/types/${entityPath}/${options.uid}`);
  }

  private extractEntityArrayForType(
    response: TypesEntitiesListRawResponse,
    entityType: TypesEntityType
  ): TypesEntityListItem[] {
    // Prefer explicit ships array key when available.
    if (entityType === 'ships') {
      const shipsResponse = response as TypesShipsListRawResponse;
      if (Array.isArray(shipsResponse.shiptype)) {
        return shipsResponse.shiptype;
      }
    }

    // Prefer explicit vehicles array key when available.
    if (entityType === 'vehicles') {
      const vehicleTypes = (response as Record<string, unknown>).vehicletype;
      if (Array.isArray(vehicleTypes)) {
        return vehicleTypes as TypesEntityListItem[];
      }
    }

    // Prefer explicit creatures array key when available.
    if (entityType === 'creatures') {
      const creatureTypes = (response as Record<string, unknown>).creaturetype;
      if (Array.isArray(creatureTypes)) {
        return creatureTypes as TypesEntityListItem[];
      }
    }

    // Prefer explicit faction module array key when available.
    if (entityType === 'factionmodules') {
      const factionModuleTypes = (response as Record<string, unknown>)['faction moduletype'];
      if (Array.isArray(factionModuleTypes)) {
        return factionModuleTypes as TypesEntityListItem[];
      }
    }

    // Prefer explicit terrain array key when available.
    if (entityType === 'terrain') {
      const terrainTypes = (response as Record<string, unknown>).terraintype;
      if (Array.isArray(terrainTypes)) {
        return terrainTypes as TypesEntityListItem[];
      }
    }

    // Prefer explicit planet array key when available.
    if (entityType === 'planets') {
      const planetTypes = (response as Record<string, unknown>).planettype;
      if (Array.isArray(planetTypes)) {
        return planetTypes as TypesEntityListItem[];
      }
    }

    // Prefer explicit weapon array key when available.
    if (entityType === 'weapons') {
      const weaponTypes = (response as Record<string, unknown>).weapontype;
      if (Array.isArray(weaponTypes)) {
        return weaponTypes as TypesEntityListItem[];
      }
    }

    // Prefer explicit race array key when available.
    if (entityType === 'races') {
      const raceTypes = (response as Record<string, unknown>).race;
      if (Array.isArray(raceTypes)) {
        return raceTypes as TypesEntityListItem[];
      }
    }

    // Prefer explicit material array key when available.
    if (entityType === 'materials') {
      const materialTypes = (response as Record<string, unknown>).materialtype;
      if (Array.isArray(materialTypes)) {
        return materialTypes as TypesEntityListItem[];
      }
    }

    // Prefer explicit droid array key when available.
    if (entityType === 'droids') {
      const droidTypes = (response as Record<string, unknown>).droidtype;
      if (Array.isArray(droidTypes)) {
        return droidTypes as TypesEntityListItem[];
      }
    }

    // Prefer explicit NPC array key when available.
    if (entityType === 'npcs') {
      const npcTypes = (response as Record<string, unknown>).npctype;
      if (Array.isArray(npcTypes)) {
        return npcTypes as TypesEntityListItem[];
      }
    }

    // Prefer explicit item array key when available.
    if (entityType === 'items') {
      const itemTypes = (response as Record<string, unknown>).itemtype;
      if (Array.isArray(itemTypes)) {
        return itemTypes as TypesEntityListItem[];
      }
    }

    // Prefer explicit facility array key when available.
    if (entityType === 'facilities') {
      const facilityTypes = (response as Record<string, unknown>).facilitytype;
      if (Array.isArray(facilityTypes)) {
        return facilityTypes as TypesEntityListItem[];
      }
    }

    // Prefer explicit station array key when available.
    if (entityType === 'stations') {
      const stationTypes = (response as Record<string, unknown>).stationtype;
      if (Array.isArray(stationTypes)) {
        return stationTypes as TypesEntityListItem[];
      }
    }

    return this.extractEntityArray(response);
  }

  private extractEntityArray(response: TypesEntitiesListRawResponse): TypesEntityListItem[] {
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
