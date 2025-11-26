/**
 * Character resource for accessing character data
 */

import { HttpClient } from '../http/HttpClient.js';
import { BaseResource } from './BaseResource.js';
import {
  Character,
  Message,
  Skill,
  GetCharacterOptions,
  GetCharacterByHandleOptions,
  ListMessagesOptions,
  GetMessageOptions,
  DeleteMessageOptions,
  CreateMessageOptions,
  GetCharacterSkillsOptions,
  GetCharacterPrivilegesOptions,
  GetCharacterCreditsOptions,
  GetCharacterCreditlogOptions,
  GetCharacterPermissionsOptions,
} from '../types/index.js';

export interface Privilege {
  name: string;
  granted: boolean;
  [key: string]: unknown;
}

export interface Credits {
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
 * Character messages resource
 */
export class CharacterMessagesResource extends BaseResource {
  /**
   * List messages sent or received by character (paginated)
   * @requires_auth Yes
   * @requires_scope MESSAGES_READ
   * @param options - Character UID, message mode, and optional pagination parameters
   * @example
   * const messages = await client.character.messages.list({ uid: '1:12345', mode: 'received' });
   * const moreMessages = await client.character.messages.list({ uid: '1:12345', mode: 'received', start_index: 51, item_count: 50 });
   */
  async list(options: ListMessagesOptions): Promise<Message[]> {
    const params: Record<string, number> = {
      start_index: options.start_index || 1,
      item_count: options.item_count || 50,
    };
    const response = await this.http.get<{ message?: Message[]; attributes?: unknown }>(`/character/${options.uid}/messages/${options.mode}`, { params });
    // API returns { attributes: {...}, message: [...] }, extract just the array
    return response.message || [];
  }

  /**
   * Get a specific message
   */
  async get(options: GetMessageOptions): Promise<Message> {
    return this.request<Message>('GET', `/character/${options.uid}/messages/${options.messageId}`);
  }

  /**
   * Delete a message
   */
  async delete(options: DeleteMessageOptions): Promise<void> {
    return this.request<void>('DELETE', `/character/${options.uid}/messages/${options.messageId}`);
  }

  /**
   * Send a message
   * @requires_auth Yes
   * @requires_scope MESSAGES_SEND
   * @param options.uid - Character UID sending the message
   * @param options.receivers - Semicolon-separated list of recipient names/UIDs (max 25)
   * @param options.communication - Message text content
   * @example
   * await client.character.messages.create({
   *   uid: '1:12345',
   *   receivers: 'recipient1;recipient2',
   *   communication: 'Hello from the SDK!'
   * });
   */
  async create(options: CreateMessageOptions): Promise<Message> {
    return this.request<Message>('PUT', `/character/${options.uid}/messages/sent`, {
      receivers: options.receivers,
      communication: options.communication,
    });
  }
}

/**
 * Character skills resource
 */
export class CharacterSkillsResource extends BaseResource {
  /**
   * Get character's skills
   */
  async list(options: GetCharacterSkillsOptions): Promise<Skill[]> {
    return this.request<Skill[]>('GET', `/character/${options.uid}/skills`);
  }
}

/**
 * Character privileges resource
 */
export class CharacterPrivilegesResource extends BaseResource {
  /**
   * Get character's privileges
   */
  async list(options: GetCharacterPrivilegesOptions): Promise<Privilege[]> {
    return this.request<Privilege[]>('GET', `/character/${options.uid}/privileges`);
  }

  /**
   * Get a specific privilege
   * @param options.uid - Character UID
   * @param options.privilegeGroup - Privilege group name
   * @param options.privilege - Privilege name
   * @param options.faction_id - Optional faction ID to view privileges for (defaults to token owner's primary faction)
   */
  async get(options: {
    uid: string;
    privilegeGroup: string;
    privilege: string;
    faction_id?: number;
  }): Promise<Privilege> {
    const params: any = {};
    if (options.faction_id !== undefined) {
      params.faction_id = options.faction_id;
    }

    return this.http.get<Privilege>(
      `/character/${options.uid}/privileges/${options.privilegeGroup}/${options.privilege}`,
      { params }
    );
  }

  /**
   * Update a specific privilege (grant or revoke)
   * @param options.uid - Character UID
   * @param options.privilegeGroup - Privilege group name
   * @param options.privilege - Privilege name
   * @param options.revoke - Set to true to revoke the privilege, false/undefined to grant it
   * @param options.faction_id - Optional faction ID to view privileges for (defaults to token owner's primary faction)
   */
  async update(options: {
    uid: string;
    privilegeGroup: string;
    privilege: string;
    revoke?: boolean;
    faction_id?: number;
  }): Promise<Privilege> {
    const data: any = {};
    if (options.revoke) {
      // Any non-empty string revokes the privilege
      data.revoke = 'true';
    }
    // If revoke is not set or false, the privilege is granted (no parameter needed)

    const params: any = {};
    if (options.faction_id !== undefined) {
      params.faction_id = options.faction_id;
    }

    return this.http.post<Privilege>(
      `/character/${options.uid}/privileges/${options.privilegeGroup}/${options.privilege}`,
      data,
      { params }
    );
  }
}

/**
 * Character credits resource
 */
export class CharacterCreditsResource extends BaseResource {
  /**
   * Get character's credits
   */
  async get(options: GetCharacterCreditsOptions): Promise<Credits> {
    return this.request<Credits>('GET', `/character/${options.uid}/credits`);
  }

  /**
   * Update character's credits (transfer)
   * @param options.uid - Character UID
   * @param options.amount - Amount to transfer
   * @param options.recipient - Recipient character or faction UID (optional)
   * @param options.reason - Reason for transfer (optional, API will auto-append client name)
   */
  async update(options: {
    uid: string;
    amount: number;
    recipient?: string;
    reason?: string;
  }): Promise<Credits> {
    const data: any = {
      amount: options.amount,
    };

    if (options.recipient) {
      data.recipient = options.recipient;
    }
    if (options.reason) {
      data.reason = options.reason;
    }

    return this.request<Credits>('POST', `/character/${options.uid}/credits`, data);
  }
}

/**
 * Character credit log resource
 */
export class CharacterCreditlogResource extends BaseResource {
  /**
   * Get character's credit log (paginated)
   *
   * @param options - Character UID and optional pagination/filtering parameters
   * @param options.uid - Character UID
   * @param options.start_index - Starting position (1-based). Default: 1
   * @param options.item_count - Number of items to retrieve. Default: 50, Max: 1000
   * @param options.start_id - Oldest transaction ID threshold (1 = oldest 1000, 0/default = newest 1000)
   * @example
   * const creditlog = await client.character.creditlog.list({ uid: '1:12345' });
   * const moreLogs = await client.character.creditlog.list({ uid: '1:12345', start_index: 51, item_count: 100 });
   * const oldestLogs = await client.character.creditlog.list({ uid: '1:12345', start_id: 1 });
   * // Fetch up to 1000 credit log entries at once
   * const manyLogs = await client.character.creditlog.list({ uid: '1:12345', item_count: 1000 });
   */
  async list(options: GetCharacterCreditlogOptions): Promise<CreditLogEntry[]> {
    const params: Record<string, number> = {
      start_index: options.start_index || 1,
      item_count: options.item_count || 50,
    };
    if (options.start_id !== undefined) {
      params.start_id = options.start_id;
    }
    const response = await this.http.get<{ creditlog?: CreditLogEntry[]; attributes?: unknown }>(`/character/${options.uid}/creditlog`, { params });
    // API returns { attributes: {...}, creditlog: [...] }, extract just the array
    return response.creditlog || [];
  }
}

/**
 * Character permissions resource
 */
export class CharacterPermissionsResource extends BaseResource {
  /**
   * Get permissions granted to API client for this character
   */
  async list(options: GetCharacterPermissionsOptions): Promise<string[]> {
    return this.request<string[]>('GET', `/character/${options.uid}/permissions`);
  }
}

/**
 * Character resource for managing characters
 */
export class CharacterResource extends BaseResource {
  public readonly messages: CharacterMessagesResource;
  public readonly skills: CharacterSkillsResource;
  public readonly privileges: CharacterPrivilegesResource;
  public readonly credits: CharacterCreditsResource;
  public readonly creditlog: CharacterCreditlogResource;
  public readonly permissions: CharacterPermissionsResource;

  constructor(http: HttpClient) {
    super(http);
    this.messages = new CharacterMessagesResource(http);
    this.skills = new CharacterSkillsResource(http);
    this.privileges = new CharacterPrivilegesResource(http);
    this.credits = new CharacterCreditsResource(http);
    this.creditlog = new CharacterCreditlogResource(http);
    this.permissions = new CharacterPermissionsResource(http);
  }

  /**
   * Get the currently authenticated user's character
   * @requires_auth Yes
   * @requires_scope CHARACTER_READ
   * @returns The authenticated character's full profile
   * @example
   * const myCharacter = await client.character.me();
   */
  async me(): Promise<Character> {
    return this.request<Character>('GET', '/character/');
  }

  /**
   * Get character by UID
   * @requires_auth Yes
   * @requires_scope CHARACTER_READ
   * @param options - Character UID
   * @example
   * const character = await client.character.get({ uid: '1:12345' });
   */
  async get(options: GetCharacterOptions): Promise<Character> {
    return this.request<Character>('GET', `/character/${options.uid}`);
  }

  /**
   * Get character UID by handle (username)
   */
  async getByHandle(options: GetCharacterByHandleOptions): Promise<{ uid: string }> {
    return this.request<{ uid: string }>('GET', `/character/handlecheck/${options.handle}`);
  }

  /**
   * Check if the API client has a specific permission for this character
   * @param options.uid - Character UID
   * @param options.permission - Permission scope to check (e.g., 'CHARACTER_READ', 'MESSAGES_SEND')
   * @returns True if the permission is granted, false otherwise
   * @example
   * const canRead = await client.character.hasPermission({ uid: '1:12345', permission: 'CHARACTER_READ' });
   * if (canRead) {
   *   const character = await client.character.get({ uid: '1:12345' });
   * }
   */
  async hasPermission(options: { uid: string; permission: string }): Promise<boolean> {
    try {
      const permissions = await this.permissions.list({ uid: options.uid });
      return permissions.includes(options.permission);
    } catch (error) {
      // If we can't fetch permissions, assume we don't have access
      return false;
    }
  }
}
