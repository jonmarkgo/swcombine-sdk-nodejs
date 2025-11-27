/**
 * Faction resource for accessing faction data
 */

import { HttpClient } from '../http/HttpClient.js';
import { BaseResource } from './BaseResource.js';
import { Faction, Character, GetFactionOptions } from '../types/index.js';

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

export interface CreditLogEntry {
  timestamp: string;
  amount: number;
  balance: number;
  description?: string;
  [key: string]: unknown;
}

/**
 * Faction members resource
 */
export class FactionMembersResource extends BaseResource {
  /**
   * List faction members (paginated)
   * @param options - Faction ID and optional pagination parameters
   * @example
   * const members = await client.faction.members.list({ factionId: '20:123' });
   * const moreMembers = await client.faction.members.list({ factionId: '20:123', start_index: 51, item_count: 50 });
   */
  async list(options: {
    factionId: string;
    start_index?: number;
    item_count?: number;
  }): Promise<FactionMember[]> {
    const params = {
      start_index: options.start_index || 1,
      item_count: options.item_count || 50,
    };
    const response = await this.http.get<{ member?: FactionMember[]; attributes?: unknown }>(`/faction/${options.factionId}/members`, { params });
    // API returns { attributes: {...}, member: [...] }, extract just the array
    return response.member || [];
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
  }): Promise<any> {
    return this.request(
      'POST',
      `/faction/${options.factionId}/members`,
      {
        uid: options.uid,
        property: options.property,
        new_value: options.new_value,
      }
    );
  }
}

/**
 * Faction budgets resource
 */
export class FactionBudgetsResource extends BaseResource {
  /**
   * List faction budgets (paginated)
   * @param options - Faction ID and optional pagination parameters
   * @example
   * const budgets = await client.faction.budgets.list({ factionId: '20:123' });
   * const moreBudgets = await client.faction.budgets.list({ factionId: '20:123', start_index: 51, item_count: 50 });
   */
  async list(options: {
    factionId: string;
    start_index?: number;
    item_count?: number;
  }): Promise<Budget[]> {
    const params = {
      start_index: options.start_index || 1,
      item_count: options.item_count || 50,
    };
    const response = await this.http.get<{ budget?: Budget[]; attributes?: unknown }>(`/faction/${options.factionId}/budgets`, { params });
    // API returns { attributes: {...}, budget: [...] }, extract just the array
    return response.budget || [];
  }

  /**
   * Get specific budget
   */
  async get(options: { factionId: string; budgetId: string }): Promise<Budget> {
    return this.request<Budget>('GET', `/faction/${options.factionId}/budget/${options.budgetId}`);
  }
}

/**
 * Faction stockholders resource
 */
export class FactionStockholdersResource extends BaseResource {
  /**
   * List faction stockholders (paginated)
   * @param options - Faction ID and optional pagination parameters
   * @example
   * const stockholders = await client.faction.stockholders.list({ factionId: '20:123' });
   * const moreStockholders = await client.faction.stockholders.list({ factionId: '20:123', start_index: 51, item_count: 50 });
   */
  async list(options: {
    factionId: string;
    start_index?: number;
    item_count?: number;
  }): Promise<Stockholder[]> {
    const params = {
      start_index: options.start_index || 1,
      item_count: options.item_count || 50,
    };
    const response = await this.http.get<{ stockholder?: Stockholder[]; attributes?: unknown }>(`/faction/${options.factionId}/stockholders`, { params });
    // API returns { attributes: {...}, stockholder: [...] }, extract just the array
    return response.stockholder || [];
  }
}

/**
 * Faction credits resource
 */
export class FactionCreditsResource extends BaseResource {
  /**
   * Get faction credits
   */
  async get(options: { factionId: string }): Promise<FactionCredits> {
    return this.request<FactionCredits>('GET', `/faction/${options.factionId}/credits`);
  }

  /**
   * Transfer faction credits
   * @param options.factionId - Faction UID
   * @param options.amount - Amount to transfer
   * @param options.recipient - Recipient character or faction UID (optional)
   * @param options.budget - Budget UID to transfer from (optional)
   * @param options.reason - Reason for transfer (optional, API will auto-append client name)
   */
  async update(options: {
    factionId: string;
    amount: number;
    recipient?: string;
    budget?: string;
    reason?: string;
  }): Promise<FactionCredits> {
    const data: any = {
      amount: options.amount,
    };

    if (options.recipient) {
      data.recipient = options.recipient;
    }
    if (options.budget) {
      data.budget = options.budget;
    }
    if (options.reason) {
      data.reason = options.reason;
    }

    return this.request<FactionCredits>('POST', `/faction/${options.factionId}/credits`, data);
  }
}

/**
 * Faction credit log resource
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
  }): Promise<CreditLogEntry[]> {
    const params: Record<string, number> = {
      start_index: options.start_index || 1,
      item_count: options.item_count || 50,
    };
    if (options.start_id !== undefined) {
      params.start_id = options.start_id;
    }
    const response = await this.http.get<{ transaction?: CreditLogEntry[]; attributes?: unknown }>(`/faction/${options.factionId}/creditlog`, { params });
    // API returns { swcapi: { transactions: { attributes: {...}, transaction: [...] } } }
    // HttpClient unwraps to { attributes: {...}, transaction: [...] }
    return response.transaction || [];
  }
}

/**
 * Faction resource for managing factions
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
   * Get faction by UID
   * @requires_auth Yes
   * @requires_scope FACTION_READ
   * @param options - Optional faction UID. If omitted or uid not provided, returns the authenticated user's primary faction.
   * @example
   * // Get a specific faction
   * const faction = await client.faction.get({ uid: '20:123' });
   * // Get the authenticated user's faction
   * const myFaction = await client.faction.get();
   */
  async get(options?: GetFactionOptions): Promise<Faction> {
    const path = options?.uid ? `/faction/${options.uid}` : '/faction/';
    return this.request<Faction>('GET', path);
  }

  /**
   * List all factions (paginated)
   * @requires_auth No
   * @param options - Optional pagination parameters
   * @example
   * const factions = await client.faction.list();
   * const moreFactions = await client.faction.list({ start_index: 51, item_count: 50 });
   */
  async list(options?: { start_index?: number; item_count?: number }): Promise<Faction[]> {
    const params = {
      start_index: options?.start_index || 1,
      item_count: options?.item_count || 50,
    };
    const response = await this.http.get<{ faction?: Faction[]; attributes?: unknown }>('/factions', { params });
    // API returns { attributes: {...}, faction: [...] }, extract just the array
    return response.faction || [];
  }
}
