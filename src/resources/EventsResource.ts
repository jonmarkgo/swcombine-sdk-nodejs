/**
 * Events resource for accessing event data
 */

import { BaseResource } from './BaseResource.js';
import { Event, QueryParams } from '../types/index.js';

/**
 * Events resource for querying events
 */
export class EventsResource extends BaseResource {
  /**
   * List events by type and mode (paginated)
   *
   * **Note:** This endpoint uses 0-based indexing (unlike most other endpoints which use 1-based).
   *
   * @param options - Event mode, event type, and optional pagination/filtering parameters
   * @param options.eventMode - Event mode: 'personal', 'faction', 'inventory', or 'combat'
   * @param options.eventType - Event type filter (optional, only for personal/faction modes)
   * @param options.start_index - Starting position (0-based). Default: 0
   * @param options.item_count - Number of items to retrieve. Default: 50, Max: 1000
   * @param options.start_time - Unix timestamp to filter events after this time
   * @param options.faction_id - Faction ID for faction mode (defaults to authenticated user's primary faction)
   * @example
   * const events = await client.events.list({ eventMode: 'personal' });
   * const moreEvents = await client.events.list({ eventMode: 'personal', start_index: 50, item_count: 100 });
   * const recentEvents = await client.events.list({ eventMode: 'personal', start_time: 1640000000 });
   * const factionEvents = await client.events.list({ eventMode: 'faction', faction_id: '20:123' });
   * // Fetch up to 1000 events at once
   * const manyEvents = await client.events.list({ eventMode: 'personal', item_count: 1000 });
   */
  async list(options: {
    eventMode: string;
    /** Event type filter (optional, only for personal/faction modes) */
    eventType?: string;
    /** Starting position (0-based). Default: 0 */
    start_index?: number;
    /** Number of items to retrieve. Default: 50, Max: 1000 */
    item_count?: number;
    /** Unix timestamp to filter events after this time */
    start_time?: number;
    /** Faction ID for faction mode */
    faction_id?: string;
  }): Promise<Event[]> {
    const params: QueryParams = {
      start_index: options.start_index !== undefined ? options.start_index : 0, // 0-based indexing!
      item_count: options.item_count || 50,
    };

    if (options.start_time !== undefined) {
      params.start_time = options.start_time;
    }
    if (options.faction_id) {
      params.faction_id = options.faction_id;
    }

    // Build path - eventType is optional
    const path = options.eventType
      ? `/events/${options.eventMode}/${options.eventType}`
      : `/events/${options.eventMode}`;

    const response = await this.http.get<Record<string, unknown>>(path, { params });
    // API returns { attributes: {...}, event: [...] }, extract just the array
    // Key name may vary, so find the array
    for (const key of Object.keys(response)) {
      if (key !== 'attributes' && Array.isArray(response[key])) {
        return response[key] as Event[];
      }
    }
    return [];
  }

  /**
   * Get specific event
   */
  async get(options: { uid: string }): Promise<Event> {
    return this.request<Event>('GET', `/event/${options.uid}`);
  }
}
