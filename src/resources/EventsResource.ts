/**
 * Events resource for accessing event data
 */

import { BaseResource } from './BaseResource.js';
import { Page } from '../pagination/Page.js';
import { CombatReport, Event, EventDetail, QueryParams } from '../types/index.js';

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
   * The API reports no total for events, so `page.total` is always 0; `hasMore` is true when a
   * full page came back.
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
    /** Milliseconds to wait before fetching each subsequent page. Helps avoid rate limits during auto-pagination. */
    pageDelay?: number;
  }): Promise<Page<Event>> {
    const itemCount = options.item_count ?? 50;
    const makeRequest = async (startIndex: number): Promise<Page<Event>> => {
      const params: QueryParams = {
        start_index: startIndex,
        item_count: itemCount,
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
        // Events attributes have no `total`, so a full page is the only signal that more exist.
        hasMore: attrs.total == null ? data.length >= itemCount : undefined,
        fetcher: makeRequest,
        pageDelay: options.pageDelay,
      });
    };

    return makeRequest(options.start_index ?? 0); // 0-based!
  }

  /**
   * Get a specific event by UID.
   *
   * Returns the `Event` object directly — not wrapped in a `Page`.
   *
   * @returns The `Event` entity.
   * @example
   * const event = await client.events.get({ uid: '5:99001' });
   * console.log(event.type); // access properties directly, not event.data
   */
  async get(options: { uid: string }): Promise<EventDetail> {
    return this.request<EventDetail>('GET', `/event/${options.uid}`);
  }

  /**
   * Get a combat report sent to the authenticated character.
   *
   * Requires the `character_events` and `character_combat_reports` scopes. 404s if the report
   * does not exist, is too old to have data, or was not sent to the character.
   *
   * @param options.reportId - Id of the combat report
   * @example
   * const report = await client.events.getCombatReport({ reportId: 1001 });
   * console.log(report.title, report.sides.side.length);
   */
  async getCombatReport(options: { reportId: number }): Promise<CombatReport> {
    return this.request<CombatReport>('GET', `/events/combat/report/${options.reportId}`);
  }

  /**
   * Get a combat report sent to one of the authenticated character's factions.
   *
   * Requires the `character_events` and `faction_combat_reports` scopes. 404s if the report
   * does not exist, is too old to have data, or was not sent to a faction whose combat events
   * the character can see.
   *
   * @param options.reportId - Id of the combat report
   * @example
   * const report = await client.events.getFactionCombatReport({ reportId: 1001 });
   */
  async getFactionCombatReport(options: { reportId: number }): Promise<CombatReport> {
    return this.request<CombatReport>('GET', `/events/faction/report/${options.reportId}`);
  }
}
