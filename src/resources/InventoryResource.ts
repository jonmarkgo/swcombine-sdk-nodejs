/**
 * Inventory resource for managing entities
 */

import { HttpClient } from '../http/HttpClient.js';
import { BaseResource } from './BaseResource.js';
import { Page } from '../pagination/Page.js';
import { SWCError } from '../http/errors.js';
import {
  GetEntityOptions,
  InventoryFilterType,
  InventoryPropertyResult,
  InventorySummary,
  InventoryTagResult,
  InventoryEntityDetailMap,
  InventoryEntityType,
  InventoryEntityTypeMap,
  ListInventoryEntitiesOptions,
  QueryParams,
} from '../types/index.js';

/**
 * Coerce skill values to numbers.
 *
 * The API returns non-zero skill values inconsistently — the same value appears as
 * both `1` and `"1"`, in every skill group, with no rule that predicts which. Zero is
 * always numeric. Normalizing here lets `EntitySkill.value` be honestly typed
 * `number` for consumers.
 *
 * This mutates nothing the caller owns: it operates on the freshly parsed response.
 */
function normalizeSkillValues(entity: unknown): void {
  const skills = (entity as { skills?: Record<string, unknown> })?.skills;
  if (!skills || typeof skills !== 'object') return;

  for (const group of Object.values(skills)) {
    if (!Array.isArray(group)) continue;
    for (const set of group) {
      const list = (set as { skill?: unknown })?.skill;
      if (!Array.isArray(list)) continue;
      for (const skill of list) {
        const entry = skill as { value?: unknown };
        if (typeof entry?.value === 'string' && entry.value.trim() !== '') {
          const asNumber = Number(entry.value);
          if (!Number.isNaN(asNumber)) entry.value = asNumber;
        }
      }
    }
  }
}

// Filter applicability per the API docs (verified live). A filter that does not apply makes the
// API answer 500 with its SQL in the message, which HttpClient would also retry.
const FILTER_ONLY_FOR: Partial<Record<InventoryFilterType, readonly InventoryEntityType[]>> = {
  underconstruction: ['ships', 'vehicles', 'stations', 'facilities'],
  opento: ['ships', 'vehicles', 'stations', 'facilities'],
  wreck: ['ships', 'vehicles', 'stations', 'facilities', 'droids'],
  powered: ['facilities'],
  debt: ['facilities'],
  deposit: ['facilities'],
  cargocontaineritems: ['items'],
  cargocontainerdroids: ['items'],
  gender: ['npcs', 'creatures'],
  level: ['npcs', 'creatures'],
  race: ['npcs'],
};
const FILTER_NOT_FOR: Partial<Record<InventoryFilterType, readonly InventoryEntityType[]>> = {
  class: ['cities', 'planets'],
  type: ['cities'],
  protected: ['planets'],
  working: ['planets', 'materials'],
};

function assertFilterApplies(type: InventoryFilterType, entityType: InventoryEntityType): void {
  const only = FILTER_ONLY_FOR[type];
  if ((only && !only.includes(entityType)) || FILTER_NOT_FOR[type]?.includes(entityType)) {
    throw new SWCError(`Inventory filter "${type}" does not apply to ${entityType}.`, {
      type: 'validation',
    });
  }
}

// "None" is an empty string for most filters, but the API ignores that for container and only
// honours the null UID "0:0" (what the website itself sends).
function toFilterValue(type: InventoryFilterType, value: unknown): string {
  if (value === null || value === undefined || value === '')
    return type === 'container' ? '0:0' : '';
  if (typeof value === 'boolean') return value ? '1' : '0';
  return String(value);
}

/** Builds query params for inventory filters. Throws before any request on invalid input. */
function buildFilterParams(
  entityType: InventoryEntityType,
  options: Pick<
    ListInventoryEntitiesOptions,
    'filters' | 'filter_type' | 'filter_value' | 'filter_inclusion'
  >
): QueryParams {
  const { filters, filter_type, filter_value, filter_inclusion } = options;
  if (filters && filter_type) {
    throw new SWCError('Use either filters or filter_type/filter_value, not both.', {
      type: 'validation',
    });
  }

  if (filters) {
    // Keyed form: filter_value[type][]=a&filter_value[type][]=b matches either value.
    const params: QueryParams = {};
    const types: string[] = [];
    for (const filter of filters) {
      assertFilterApplies(filter.type, entityType);
      if (types.includes(filter.type)) {
        throw new SWCError(
          `Inventory filter "${filter.type}" given twice. Pass one filter with an array of values to match any of them.`,
          { type: 'validation' }
        );
      }
      types.push(filter.type);
      const values = Array.isArray(filter.value) ? filter.value : [filter.value];
      params[`filter_value[${filter.type}]`] = values.map((v) => toFilterValue(filter.type, v));
      params[`filter_inclusion[${filter.type}]`] = filter.inclusion ?? 'includes';
    }
    if (types.length) params.filter_type = types;
    return params;
  }

  if (!filter_type?.length) return {};
  // Legacy positional arrays. The API rejects a missing inclusion with a 400, so default it.
  if (filter_value?.length !== filter_type.length) {
    throw new SWCError('filter_value must have one entry per filter_type.', { type: 'validation' });
  }
  filter_type.forEach((type) => assertFilterApplies(type, entityType));
  return {
    filter_type,
    filter_value: filter_value.map((v, i) => toFilterValue(filter_type[i], v)),
    filter_inclusion: filter_type.map((_, i) => filter_inclusion?.[i] ?? 'includes'),
  };
}

/**
 * Inventory entities resource
 *
 * @see https://www.swcombine.com/ws/v2.0/documentation/inventory/uid/entity_type/assign_type/ SW Combine API Documentation
 */
export class InventoryEntitiesResource extends BaseResource {
  /**
   * List entities in inventory (paginated with optional filtering)
   *
   * Supports filtering via `filters` (see the `InventoryFilter` type for value formats and API quirks).
   * Filters are checked against the entity type before the request is sent.
   *
   * The `uid` argument accepts either a character UID (e.g. `1:12345`) or a faction UID
   * (e.g. `20:123`) — there is no separate `client.faction.entities` accessor; faction-owned
   * entities are queried through this method.
   *
   * @param options - Inventory UID, entity type, assign type, and optional pagination/filtering parameters
   * @param options.uid - Character or Faction UID
   * @param options.entityType - Entity type: 'ships', 'vehicles', 'stations', 'cities', 'facilities', 'planets', 'items', 'npcs', 'droids', 'creatures', or 'materials'
   * @param options.assignType - Assignment type: 'owner', 'commander', or 'pilot'
   *
   * **Quirk:** planets a character administers are returned under `assignType: 'pilot'`.
   * Both `'owner'` and `'commander'` return 0 for them.
   *
   * @param options.start_index - Starting position (1-based). Default: 1
   * @param options.item_count - Number of items to retrieve. Default: 50, Max: 200
   * @param options.filters - Filters to apply; several values for one type match any of them
   * @example
   * // Character-owned ships
   * const myShips = await client.inventory.entities.list({ uid: '1:12345', entityType: 'ships', assignType: 'owner' });
   *
   * // Faction-owned ships — pass a faction UID instead of a character UID
   * const factionShips = await client.inventory.entities.list({ uid: '20:123', entityType: 'ships', assignType: 'owner' });
   *
   * // Faction facilities
   * const factionFacilities = await client.inventory.entities.list({ uid: '20:123', entityType: 'facilities', assignType: 'owner' });
   *
   * // Vehicles a character is piloting
   * const pilotedVehicles = await client.inventory.entities.list({ uid: '1:12345', entityType: 'vehicles', assignType: 'pilot' });
   *
   * // Fetch up to 200 entities at once
   * const moreEntities = await client.inventory.entities.list({ uid: '1:12345', entityType: 'vehicles', assignType: 'pilot', start_index: 1, item_count: 200 });
   *
   * // Administered planets — note the assign type
   * const planets = await client.inventory.entities.list({ uid: '1:12345', entityType: 'planets', assignType: 'pilot' });
   *
   * // Ships of either of two types that are not under construction
   * const ships = await client.inventory.entities.list({
   *   uid: '1:12345',
   *   entityType: 'ships',
   *   assignType: 'owner',
   *   filters: [
   *     { type: 'type', value: ['2:7', '2:19'] },
   *     { type: 'underconstruction', value: false },
   *   ],
   * });
   *
   * // Ships not docked in any ship or station ("None" is `null`)
   * const undocked = await client.inventory.entities.list({
   *   uid: '1:12345',
   *   entityType: 'ships',
   *   assignType: 'owner',
   *   filters: [{ type: 'container', value: null }],
   * });
   */
  async list<T extends InventoryEntityType>(
    options: ListInventoryEntitiesOptions<T>
  ): Promise<Page<InventoryEntityTypeMap[T]>> {
    const filterParams = buildFilterParams(options.entityType, options);
    const makeRequest = async (startIndex: number): Promise<Page<InventoryEntityTypeMap[T]>> => {
      const params: QueryParams = {
        start_index: startIndex,
        item_count: options.item_count ?? 50,
        ...filterParams,
      };

      const response = await this.http.get<Record<string, unknown>>(
        `/inventory/${options.uid}/${options.entityType}/${options.assignType}`,
        { params }
      );

      // API returns { filters: {...}, entities: { attributes: {...}, entity: [...] } }
      const entities = response.entities as Record<string, unknown> | undefined;
      const data = (
        entities && Array.isArray(entities.entity) ? entities.entity : []
      ) as InventoryEntityTypeMap[T][];
      const attrs = (entities?.attributes || {}) as Record<string, unknown>;

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
   * Get a specific inventory entity by type and UID.
   *
   * Returns the entity object directly — not wrapped in a `Page`. The return type
   * is narrowed by `entityType`, so `entityType: 'npcs'` yields an `NpcEntityDetail`
   * with `race`, `gender` and `level`.
   *
   * @returns The entity detail for the requested type.
   * @example
   * const ship = await client.inventory.entities.get({ entityType: 'ships', uid: '2:283' });
   * console.log(ship.name);
   *
   * @example
   * // Actions are always an array, even when there is only one.
   * const facility = await client.inventory.entities.get({ entityType: 'facilities', uid: '4:3497164' });
   * for (const action of facility.actions?.action ?? []) {
   *   console.log(action.value.actiontype);
   * }
   */
  async get<T extends InventoryEntityType>(
    options: GetEntityOptions<T>
  ): Promise<InventoryEntityDetailMap[T]> {
    const entity = await this.request<InventoryEntityDetailMap[T]>(
      'GET',
      `/inventory/${options.entityType}/${options.uid}`
    );
    normalizeSkillValues(entity);
    return entity;
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
  }): Promise<InventoryPropertyResult> {
    const data: Record<string, string> = {
      new_value: options.new_value,
    };
    if (options.reason) {
      data.reason = options.reason;
    }

    return this.request<InventoryPropertyResult>(
      'POST',
      `/inventory/${options.entityType}/${options.uid}/${options.property}/`,
      data
    );
  }

  /**
   * Add tag to entity
   */
  async addTag(options: {
    entityType: string;
    uid: string;
    tag: string;
  }): Promise<InventoryTagResult> {
    return this.request<InventoryTagResult>(
      'PUT',
      `/inventory/${options.entityType}/${options.uid}/tag/${options.tag}`
    );
  }

  /**
   * Remove tag from entity
   */
  async removeTag(options: {
    entityType: string;
    uid: string;
    tag: string;
  }): Promise<InventoryTagResult> {
    return this.request<InventoryTagResult>(
      'DELETE',
      `/inventory/${options.entityType}/${options.uid}/tag/${options.tag}`
    );
  }

  /**
   * Remove all tags from entity
   */
  async removeAllTags(options: { entityType: string; uid: string }): Promise<InventoryTagResult> {
    return this.request<InventoryTagResult>(
      'DELETE',
      `/inventory/${options.entityType}/${options.uid}/tags`
    );
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
   * Get inventory summary by UID.
   *
   * Returns the inventory summary object directly — not wrapped in a `Page`.
   *
   * Accepts either a character UID or a faction UID.
   *
   * @returns The inventory summary.
   * @example
   * // Character inventory summary
   * const characterOverview = await client.inventory.get({ uid: '1:12345' });
   *
   * // Faction inventory summary
   * const factionOverview = await client.inventory.get({ uid: '20:123' });
   * console.log(factionOverview); // access properties directly, not factionOverview.data
   */
  async get(options: { uid: string }): Promise<InventorySummary> {
    return this.request<InventorySummary>('GET', `/inventory/${options.uid}`);
  }
}
