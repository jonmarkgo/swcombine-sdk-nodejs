/**
 * Inventory resource for managing entities
 */

import { HttpClient } from '../http/HttpClient.js';
import { BaseResource } from './BaseResource.js';
import { Page } from '../pagination/Page.js';
import { SWCError } from '../http/errors.js';
import {
  GetEntityOptions,
  InventoryEntityProperty,
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
  const str = String(value);
  // The API reads any non-numeric value for these as ID 0, i.e. "None": a name given to
  // `pilot` silently returns entities with no pilot, and to `owner` it matches nothing.
  if (ID_FILTERS.has(type) && !/^\d+(:\d+)?$/.test(str)) {
    throw new SWCError(
      `Inventory filter "${type}" needs a UID like "1:12345" (or numeric ID), not "${str}". Use null for "None".`,
      { type: 'validation' }
    );
  }
  return str;
}

const ID_FILTERS = new Set<InventoryFilterType>([
  'class',
  'city',
  'planet',
  'sector',
  'system',
  'type',
  'id',
  'pilot',
  'deposit',
  'cargocontaineritems',
  'cargocontainerdroids',
  'race',
  'owner',
  'commander',
  'container',
]);

/**
 * Builds the filter part of a list request. `filters` go in a POST body as a JSON array, which
 * returns the same rows as the GET (verified live) without the server's 8 KB URL limit: a GET
 * with a few hundred filter values is rejected with a 414. The deprecated positional arrays stay
 * query params. Throws before any request on invalid input.
 */
function buildFilterRequest(
  entityType: InventoryEntityType,
  options: Pick<
    ListInventoryEntitiesOptions,
    'filters' | 'filter_type' | 'filter_value' | 'filter_inclusion'
  >
): { params: QueryParams; body?: { filters: string } } {
  const { filters, filter_type, filter_value, filter_inclusion } = options;
  if (filters && filter_type) {
    throw new SWCError('Use either filters or filter_type/filter_value, not both.', {
      type: 'validation',
    });
  }

  if (filters?.length) {
    const types: string[] = [];
    const inBody = filters.map((filter) => {
      assertFilterApplies(filter.type, entityType);
      if (types.includes(filter.type)) {
        throw new SWCError(
          `Inventory filter "${filter.type}" given twice. Pass one filter with an array of values to match any of them.`,
          { type: 'validation' }
        );
      }
      types.push(filter.type);
      const values = Array.isArray(filter.value) ? filter.value : [filter.value];
      return {
        type: filter.type,
        value: values.map((v) => toFilterValue(filter.type, v)),
        inclusion: filter.inclusion ?? 'includes',
      };
    });
    return { params: {}, body: { filters: JSON.stringify(inBody) } };
  }

  if (!filter_type?.length) return { params: {} };
  // Legacy positional arrays. The API rejects a missing inclusion with a 400, so default it.
  if (filter_value?.length !== filter_type.length) {
    throw new SWCError('filter_value must have one entry per filter_type.', { type: 'validation' });
  }
  filter_type.forEach((type) => assertFilterApplies(type, entityType));
  return {
    params: {
      filter_type,
      filter_value: filter_value.map((v, i) => toFilterValue(filter_type[i], v)),
      filter_inclusion: filter_type.map((_, i) => filter_inclusion?.[i] ?? 'includes'),
    },
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
   * Filters are checked against the entity type before the request is sent. They are sent in a POST
   * body, so a long list (for example hundreds of entity IDs) is not capped by the server's URL limit.
   *
   * The `uid` argument accepts either a character UID (e.g. `1:12345`) or a faction UID
   * (e.g. `20:123`) — there is no separate `client.faction.entities` accessor; faction-owned
   * entities are queried through this method.
   *
   * @param options - Inventory UID, entity type, assign type, and optional pagination/filtering parameters
   * @param options.uid - Whose inventory: a character or faction UID, or their name (e.g. `'kira vane'`)
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
    const { params: filterParams, body } = buildFilterRequest(options.entityType, options);
    const path = `/inventory/${options.uid}/${options.entityType}/${options.assignType}`;
    const makeRequest = async (startIndex: number): Promise<Page<InventoryEntityTypeMap[T]>> => {
      const params: QueryParams = {
        start_index: startIndex,
        item_count: options.item_count ?? 50,
        ...filterParams,
      };

      const response = body
        ? await this.http.post<Record<string, unknown>>(path, body, { params })
        : await this.http.get<Record<string, unknown>>(path, { params });

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
    property: InventoryEntityProperty;
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
   * Update a property on up to 100 entities in one request
   *
   * The API rejects the request as a whole if the client or the character lacks the
   * permission for any of the entities. Otherwise, entities the change could not be applied
   * to are listed under `data.failed`, with the reason.
   *
   * @param options.property - Property to update
   * @param options.uids - UIDs of the entities to change (1 to 100). Entity types may be mixed
   * @param options.new_value - New value, applied to every entity:
   * - `name`: the new name (max 50 characters)
   * - `open-to`: `public`, `faction` or `none` (any other value is treated as `none`)
   * - `owner`, `commander`, `pilot`, `crewlist-add`, `crewlist-remove`: the name of the character or faction
   * - `infotext`: the new text
   * - `action`: `resume`, `pause` or `abort`
   * - `crewlist-clear`: ignored, but a value must still be sent
   * @param options.reason - Optional reason for the change. Only recorded when changing the owner, commander or pilot
   * @example
   * const result = await client.inventory.entities.updateProperties({
   *   property: 'commander',
   *   uids: ['2:1002', '3:2001'],
   *   new_value: 'Dax Orin',
   * });
   * console.log(result.data.succeeded.entity.map((entity) => entity.uid));
   * console.log(result.data.failed.entity);
   */
  async updateProperties(options: {
    property: InventoryEntityProperty;
    uids: string[];
    new_value: string;
    reason?: string;
  }): Promise<InventoryPropertyResult> {
    if (options.uids.length < 1 || options.uids.length > 100) {
      throw new SWCError(
        `updateProperties() needs between 1 and 100 uids, got ${options.uids.length}.`,
        { type: 'validation' }
      );
    }

    const data: Record<string, string | string[]> = {
      uids: options.uids,
      new_value: options.new_value,
    };
    if (options.reason) {
      data.reason = options.reason;
    }

    return this.request<InventoryPropertyResult>(
      'POST',
      `/inventory/entities/${options.property}/`,
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
