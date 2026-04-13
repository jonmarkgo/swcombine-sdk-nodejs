/**
 * Faction resource for accessing faction data
 */

import { HttpClient } from '../http/HttpClient.js';
import { BaseResource } from './BaseResource.js';
import { Page } from '../pagination/Page.js';
import {
  FactionDetail,
  Character,
  GetFactionOptions,
  GetFactionCreditsOptions,
  TransferFactionCreditsOptions,
  CreditLogEntry,
  FactionListItem,
  ListFactionsOptions,
} from '../types/index.js';

export interface FactionMember {
  character: Character | string;
  rank?: string;
  joinDate?: string;
  [key: string]: unknown;
}

export interface Budget {
  uid: string;
  name: string;
  amount: number;
  [key: string]: unknown;
}

export interface Stockholder {
  character: Character | string;
  shares: number;
  percentage: number;
  [key: string]: unknown;
}

export interface FactionCredits {
  amount: number;
  [key: string]: unknown;
}

/**
 * Faction members resource
 *
 * @see https://www.swcombine.com/ws/v2.0/documentation/faction/fuid/members/ SW Combine API Documentation
 */
export class FactionMembersResource extends BaseResource {
  /**
   * List faction members (paginated)
   * @param options - Faction ID and optional pagination parameters
   * @example
   * const page = await client.faction.members.list({ factionId: '20:123' });
   * console.log(page.data); // FactionMember[]
   * // Iterate all pages:
   * for await (const member of page) { console.log(member); }
   */
  async list(options: {
    factionId: string;
    start_index?: number;
    item_count?: number;
    pageDelay?: number;
  }): Promise<Page<FactionMember>> {
    const makeRequest = async (startIndex: number): Promise<Page<FactionMember>> => {
      const params = {
        start_index: startIndex,
        item_count: options.item_count ?? 50,
      };
      const response = await this.http.get<Record<string, unknown>>(
        `/faction/${options.factionId}/members`,
        { params }
      );
      const data = (response.member ?? []) as FactionMember[];
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
   * Update faction member info field
   * @param options.factionId - Faction UID
   * @param options.uid - Character UID to update
   * @param options.property - Which info field to update (info1, info2, or info3)
   * @param options.new_value - New value for the info field
   */
  async updateMemberInfo(options: {
    factionId: string;
    uid: string;
    property: 'info1' | 'info2' | 'info3';
    new_value: string;
  }): Promise<Record<string, unknown>> {
    return this.request('POST', `/faction/${options.factionId}/members`, {
      uid: options.uid,
      property: options.property,
      new_value: options.new_value,
    });
  }
}

/**
 * Faction budgets resource
 *
 * @see https://www.swcombine.com/ws/v2.0/documentation/faction/uid/budgets/ SW Combine API Documentation
 */
export class FactionBudgetsResource extends BaseResource {
  /**
   * List faction budgets (paginated)
   * @param options - Faction ID and optional pagination parameters
   * @example
   * const page = await client.faction.budgets.list({ factionId: '20:123' });
   * console.log(page.data); // Budget[]
   * // Iterate all pages:
   * for await (const budget of page) { console.log(budget); }
   */
  async list(options: {
    factionId: string;
    start_index?: number;
    item_count?: number;
    pageDelay?: number;
  }): Promise<Page<Budget>> {
    const makeRequest = async (startIndex: number): Promise<Page<Budget>> => {
      const params = {
        start_index: startIndex,
        item_count: options.item_count ?? 50,
      };
      const response = await this.http.get<Record<string, unknown>>(
        `/faction/${options.factionId}/budgets`,
        { params }
      );
      const data = (response.budget ?? []) as Budget[];
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
   * Get a specific faction budget.
   *
   * Returns the `Budget` object directly — not wrapped in a `Page`.
   *
   * @returns The `Budget` entity.
   * @example
   * const budget = await client.faction.budgets.get({ factionId: '20:123', budgetId: 'budget-uid' });
   * console.log(budget); // access properties directly, not budget.data
   */
  async get(options: { factionId: string; budgetId: string }): Promise<Budget> {
    return this.request<Budget>('GET', `/faction/${options.factionId}/budget/${options.budgetId}`);
  }
}

/**
 * Faction stockholders resource
 *
 * @see https://www.swcombine.com/ws/v2.0/documentation/faction/uid/stockholders/ SW Combine API Documentation
 */
export class FactionStockholdersResource extends BaseResource {
  /**
   * List faction stockholders (paginated)
   * @param options - Faction ID and optional pagination parameters
   * @example
   * const page = await client.faction.stockholders.list({ factionId: '20:123' });
   * console.log(page.data); // Stockholder[]
   * // Iterate all pages:
   * for await (const stockholder of page) { console.log(stockholder); }
   */
  async list(options: {
    factionId: string;
    start_index?: number;
    item_count?: number;
    pageDelay?: number;
  }): Promise<Page<Stockholder>> {
    const makeRequest = async (startIndex: number): Promise<Page<Stockholder>> => {
      const params = {
        start_index: startIndex,
        item_count: options.item_count ?? 50,
      };
      const response = await this.http.get<Record<string, unknown>>(
        `/faction/${options.factionId}/stockholders`,
        { params }
      );
      const data = (response.stockholder ?? []) as Stockholder[];
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
}

/**
 * Faction credits resource
 *
 * @see https://www.swcombine.com/ws/v2.0/documentation/faction/uid/credits/ SW Combine API Documentation
 */
export class FactionCreditsResource extends BaseResource {
  /**
   * Get faction credit balance.
   *
   * Returns the `FactionCredits` object directly — not wrapped in a `Page`.
   *
   * @returns The `FactionCredits` data.
   * @example
   * const credits = await client.faction.credits.get({ factionId: '20:123' });
   * console.log(credits); // access properties directly, not credits.data
   */
  async get(options: GetFactionCreditsOptions): Promise<FactionCredits> {
    return this.request<FactionCredits>('GET', `/faction/${options.factionId}/credits`);
  }

  /**
   * Transfer faction credits
   * @param options.factionId - Faction UID
   * @param options.amount - Amount to transfer
   * @param options.recipient - Recipient character or faction name/UID (REQUIRED)
   * @param options.budget - Budget UID to transfer from (optional)
   * @param options.reason - Reason for transfer (optional, API will auto-append client name)
   */
  async transfer(options: TransferFactionCreditsOptions): Promise<unknown> {
    const data: Record<string, unknown> = {
      amount: options.amount,
      recipient: options.recipient,
    };

    if (options.budget) {
      data.budget = options.budget;
    }
    if (options.reason) {
      data.reason = options.reason;
    }

    return this.request<unknown>('POST', `/faction/${options.factionId}/credits`, data);
  }
}

/**
 * Faction credit log resource
 *
 * @see https://www.swcombine.com/ws/v2.0/documentation/faction/uid/creditlog/ SW Combine API Documentation
 */
export class FactionCreditlogResource extends BaseResource {
  /**
   * Get faction credit log (paginated)
   *
   * @param options - Faction ID and optional pagination/filtering parameters
   * @param options.factionId - Faction UID
   * @param options.start_index - Starting position (1-based). Default: 1
   * @param options.item_count - Number of items to retrieve. Default: 50, Max: 1000
   * @param options.start_id - Oldest transaction ID threshold (1 = oldest 1000, 0/default = newest 1000)
   * @example
   * const creditlog = await client.faction.creditlog.list({ factionId: '20:123' });
   * const moreLogs = await client.faction.creditlog.list({ factionId: '20:123', start_index: 51, item_count: 100 });
   * const oldestLogs = await client.faction.creditlog.list({ factionId: '20:123', start_id: 1 });
   * // Fetch up to 1000 credit log entries at once
   * const manyLogs = await client.faction.creditlog.list({ factionId: '20:123', item_count: 1000 });
   */
  async list(options: {
    factionId: string;
    /** Starting position (1-based). Default: 1 */
    start_index?: number;
    /** Number of items to retrieve. Default: 50, Max: 1000 */
    item_count?: number;
    /** Oldest transaction ID threshold (1 = oldest 1000, 0/default = newest 1000) */
    start_id?: number;
    /** Milliseconds to wait before fetching each subsequent page. Helps avoid rate limits during auto-pagination. */
    pageDelay?: number;
  }): Promise<Page<CreditLogEntry>> {
    const makeRequest = async (startIndex: number): Promise<Page<CreditLogEntry>> => {
      const params: Record<string, number> = {
        start_index: startIndex,
        item_count: options.item_count ?? 50,
      };
      if (options.start_id !== undefined) {
        params.start_id = options.start_id;
      }
      const response = await this.http.get<Record<string, unknown>>(
        `/faction/${options.factionId}/creditlog`,
        { params }
      );
      // API returns { swcapi: { transactions: { attributes: {...}, transaction: [...] } } }
      // HttpClient unwraps to { attributes: {...}, transaction: [...] }
      const data = (response.transaction ?? []) as CreditLogEntry[];
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
}

/**
 * Faction resource for managing factions
 *
 * @see https://www.swcombine.com/ws/v2.0/documentation/faction/uid/ SW Combine API Documentation
 */
export class FactionResource extends BaseResource {
  public readonly members: FactionMembersResource;
  public readonly budgets: FactionBudgetsResource;
  public readonly stockholders: FactionStockholdersResource;
  public readonly credits: FactionCreditsResource;
  public readonly creditlog: FactionCreditlogResource;

  constructor(http: HttpClient) {
    super(http);
    this.members = new FactionMembersResource(http);
    this.budgets = new FactionBudgetsResource(http);
    this.stockholders = new FactionStockholdersResource(http);
    this.credits = new FactionCreditsResource(http);
    this.creditlog = new FactionCreditlogResource(http);
  }

  /**
   * Get faction by UID.
   *
   * Returns the `FactionDetail` object directly — not wrapped in a `Page`.
   *
   * @requires_auth Yes
   * @requires_scope FACTION_READ
   * @param options - Optional faction UID. If omitted or uid not provided, returns the authenticated user's primary faction.
   * @returns The `FactionDetail` entity.
   * @example
   * // Get a specific faction
   * const faction = await client.faction.get({ uid: '20:123' });
   * console.log(faction.name); // access properties directly, not faction.data
   *
   * // Get the authenticated user's faction
   * const myFaction = await client.faction.get();
   */
  async get(options?: GetFactionOptions): Promise<FactionDetail> {
    const path = options?.uid ? `/faction/${options.uid}` : '/faction/';
    return this.request<FactionDetail>('GET', path);
  }

  /**
   * List all factions (paginated)
   * @requires_auth No
   * @param options - Optional pagination parameters
   * @example
   * const page = await client.faction.list();
   * console.log(page.total);
   * console.log(page.data[0]?.value);
   *
   * // Iterate all pages:
   * for await (const faction of page) { console.log(faction); }
   */
  async list(options?: ListFactionsOptions): Promise<Page<FactionListItem>> {
    const makeRequest = async (startIndex: number): Promise<Page<FactionListItem>> => {
      const params = {
        start_index: startIndex,
        item_count: options?.item_count ?? 50,
      };
      const response = await this.http.get<Record<string, unknown>>('/factions', { params });
      const data = (response.faction ?? []) as FactionListItem[];
      const attrs = (response.attributes ?? {}) as Record<string, unknown>;

      return this.createPage({
        data,
        attributes: attrs,
        defaultStart: 1,
        fetcher: makeRequest,
        pageDelay: options?.pageDelay,
      });
    };

    return makeRequest(options?.start_index ?? 1);
  }
}
