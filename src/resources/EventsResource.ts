/**
 * Events resource for accessing event data
 */

import { BaseResource } from './BaseResource.js';
import { Page } from '../pagination/Page.js';
import { Event, QueryParams } from '../types/index.js';

/**
 * Events resource for querying events
 *
 * @see https://www.swcombine.com/ws/v2.0/documentation/events/event_mode/event_type/ SW Combine API Documentation
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
  }): Promise<Page<Event>> {
    const makeRequest = async (startIndex: number): Promise<Page<Event>> => {
      const params: QueryParams = {
        start_index: startIndex,
        item_count: options.item_count ?? 50,
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

      // Extract array — find the non-attributes array key
      let data: Event[] = [];
      let attrs: Record<string, unknown> = {};
      for (const key of Object.keys(response)) {
        if (key === 'attributes') {
          attrs = response[key] as Record<string, unknown>;
        } else if (Array.isArray(response[key])) {
          data = response[key] as Event[];
        }
      }

      return this.createPage({
        data,
        attributes: attrs,
        defaultStart: 0, // 0-based!
        fetcher: makeRequest,
      });
    };

    return makeRequest(options.start_index ?? 0); // 0-based!
  }

  /**
   * Get specific event
   */
  async get(options: { uid: string }): Promise<Event> {
    return this.request<Event>('GET', `/event/${options.uid}`);
  }
}
