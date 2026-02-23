/**
 * Character resource for accessing character data
 */

import { HttpClient } from '../http/HttpClient.js';
import { SWCError } from '../http/errors.js';
import { BaseResource } from './BaseResource.js';
import {
  Character,
  CharacterMe,
  Message,
  MessageListItem,
  CreditLogEntry,
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

// Note: Privilege interface moved to CharacterPrivilegesResource section with correct structure

// Note: Character credits endpoint returns a plain number, not an object

/**
 * Character messages resource
 *
 * @see https://www.swcombine.com/ws/v2.0/documentation/character/uid/messages/mode/ SW Combine API Documentation
 */
export class CharacterMessagesResource extends BaseResource {
  private normalizeAndValidateReceivers(receivers: string): string {
    const receiverHandles = receivers
      .split(';')
      .map((receiver) => receiver.trim())
      .filter((receiver) => receiver.length > 0);

    if (receiverHandles.length === 0) {
      throw new SWCError(
        'Invalid messages.create receivers: provide at least one receiver handle.',
        {
          type: 'validation',
        }
      );
    }

    if (receiverHandles.length > 25) {
      throw new SWCError(
        'Invalid messages.create receivers: maximum 25 receiver handles are allowed.',
        {
          type: 'validation',
        }
      );
    }

    const uidLikeReceiver = receiverHandles.find((receiver) => /^\d+:\d+$/.test(receiver));
    if (uidLikeReceiver) {
      throw new SWCError(
        `Invalid messages.create receivers: "${uidLikeReceiver}" looks like a UID. Use receiver handles in the semicolon-separated receivers string.`,
        {
          type: 'validation',
        }
      );
    }

    return receiverHandles.join(';');
  }

  /**
   * List messages sent or received by character (paginated)
   *
   * Note: list responses return `MessageListItem[]` metadata objects and do not
   * guarantee a `communication` field. Use `get()` for full message content.
   *
   * @requires_auth Yes
   * @requires_scope MESSAGES_READ
   * @param options - Character UID, optional message mode, and optional pagination parameters
   * @param options.uid - Character UID
   * @param options.mode - 'sent' or 'received'. If omitted, returns both sent and received messages.
   * @param options.start_index - Starting position (1-based). Default: 1
   * @param options.item_count - Number of items to retrieve. Default: 50, Max: 50
   * @returns Array of message metadata items (`MessageListItem[]`)
   * @example
   * const allMessages = await client.character.messages.list({ uid: '1:12345' });
   * const received = await client.character.messages.list({ uid: '1:12345', mode: 'received' });
   * const moreMessages = await client.character.messages.list({ uid: '1:12345', mode: 'received', start_index: 51, item_count: 50 });
   *
   * const firstMessageId = received[0]?.attributes.uid;
   * if (firstMessageId) {
   *   const detail = await client.character.messages.get({ uid: '1:12345', messageId: firstMessageId });
   *   console.log(detail.communication);
   * }
   */
  async list(options: ListMessagesOptions): Promise<MessageListItem[]> {
    const params: Record<string, number> = {
      start_index: options.start_index || 1,
      item_count: options.item_count || 50,
    };
    // Build path - mode is optional, omitting it returns both sent and received
    const path = options.mode
      ? `/character/${options.uid}/messages/${options.mode}`
      : `/character/${options.uid}/messages`;
    const response = await this.http.get<{ message?: MessageListItem[]; attributes?: unknown }>(
      path,
      { params }
    );
    // API returns { attributes: {...}, message: [...] }, extract just the array
    return response.message || [];
  }

  /**
   * Get a specific message
   * @requires_auth Yes
   * @requires_scope MESSAGES_READ
   * @param options - Character UID and message UID
   * @param options.uid - Character UID
   * @param options.messageId - Message UID (for example from `list()[i].attributes.uid`)
   * @returns Full message details including `communication`
   * @example
   * const messages = await client.character.messages.list({ uid: '1:12345', mode: 'received' });
   * const messageId = messages[0]?.attributes.uid;
   *
   * if (messageId) {
   *   const message = await client.character.messages.get({ uid: '1:12345', messageId });
   *   console.log(message.communication);
   * }
   */
  async get(options: GetMessageOptions): Promise<Message> {
    return this.request<Message>('GET', `/character/${options.uid}/messages/${options.messageId}`);
  }

  /**
   * Delete a message
   * @requires_auth Yes
   * @requires_scope MESSAGES_DELETE
   */
  async delete(options: DeleteMessageOptions): Promise<void> {
    return this.request<void>('DELETE', `/character/${options.uid}/messages/${options.messageId}`);
  }

  /**
   * Send a message
   * @requires_auth Yes
   * @requires_scope MESSAGES_SEND
   * @param options.uid - Character UID sending the message
   * @param options.receivers - Semicolon-separated list of receiver handles (max 25)
   * @param options.communication - Message text content
   * @returns Message response typed as `Message`
   * @example
   * // Valid: handles
   * await client.character.messages.create({
   *   uid: '1:12345',
   *   receivers: 'recipient_handle_1;recipient_handle_2',
   *   communication: 'Hello from the SDK!'
   * });
   *
   * @example
   * // Invalid: UIDs are rejected by the API and pre-validated by this SDK
   * await client.character.messages.create({
   *   uid: '1:12345',
   *   receivers: '1:12345',
   *   communication: 'Test'
   * });
   */
  async create(options: CreateMessageOptions): Promise<Message> {
    const receivers = this.normalizeAndValidateReceivers(options.receivers);

    return this.request<Message>('PUT', `/character/${options.uid}/messages`, {
      receivers,
      communication: options.communication,
    });
  }
}

/**
 * Skill entry from API
 */
export interface SkillEntry {
  attributes: {
    type: string;
  };
  value: number;
}

/**
 * Skill category from API
 */
export interface SkillCategory {
  attributes?: {
    force?: string;
    count?: number;
  };
  skill: SkillEntry[];
}

/**
 * Character skills response - organized by category
 */
export interface CharacterSkills {
  general?: SkillCategory[];
  space?: SkillCategory[];
  ground?: SkillCategory[];
  social?: SkillCategory[];
  science?: SkillCategory[];
  light?: SkillCategory[];
  dark?: SkillCategory[];
  neutral?: SkillCategory[];
  [key: string]: SkillCategory[] | undefined;
}

/**
 * Character skills resource
 *
 * @see https://www.swcombine.com/ws/v2.0/documentation/character/uid/skills/ SW Combine API Documentation
 */
export class CharacterSkillsResource extends BaseResource {
  /**
   * Get character's skills organized by category
   * @requires_auth Yes
   * @requires_scope CHARACTER_SKILLS
   * @returns Skills object with categories: general, space, ground, social, science, light, dark, neutral
   * @example
   * const skills = await client.character.skills.list({ uid: '1:12345' });
   * skills.general?.[0].skill.forEach(s => console.log(s.attributes.type, s.value));
   */
  async list(options: GetCharacterSkillsOptions): Promise<CharacterSkills> {
    return this.request<CharacterSkills>('GET', `/character/${options.uid}/skills`);
  }
}

/**
 * Privilege detail from API
 */
export interface PrivilegeDetail {
  attributes: {
    uid: string;
    href?: string;
  };
  value: string; // "true" or "false"
}

/**
 * Privilege group from API
 */
export interface PrivilegeGroup {
  attributes: {
    name: string;
    count: number;
  };
  privilege: PrivilegeDetail[];
}

/**
 * Full privileges response from API
 */
export interface PrivilegesResponse {
  privilegegroup: PrivilegeGroup[];
  attributes: {
    faction_id: number;
    faction_name: string;
    count: number;
  };
}

/**
 * Character privileges resource
 *
 * @see https://www.swcombine.com/ws/v2.0/documentation/character/uid/privileges/ SW Combine API Documentation
 */
export class CharacterPrivilegesResource extends BaseResource {
  /**
   * Get character's privileges organized by group
   * @requires_auth Yes
   * @requires_scope CHARACTER_PRIVILEGES
   * @param options.uid - Character UID
   * @param options.faction_id - Optional faction ID (defaults to token owner's primary faction)
   * @returns Privileges response with groups and metadata
   * @example
   * const privs = await client.character.privileges.list({ uid: '1:12345' });
   * privs.privilegegroup.forEach(g => {
   *   console.log(`${g.attributes.name}: ${g.attributes.count} privileges`);
   * });
   */
  async list(options: GetCharacterPrivilegesOptions & { faction_id?: number }): Promise<PrivilegesResponse> {
    const params: Record<string, number> = {};
    if (options.faction_id !== undefined) {
      params.faction_id = options.faction_id;
    }
    return this.http.get<PrivilegesResponse>(`/character/${options.uid}/privileges`, { params });
  }

  /**
   * Get a specific privilege
   * @requires_auth Yes
   * @requires_scope CHARACTER_PRIVILEGES
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
  }): Promise<PrivilegeDetail> {
    const params: Record<string, number> = {};
    if (options.faction_id !== undefined) {
      params.faction_id = options.faction_id;
    }

    return this.http.get<PrivilegeDetail>(
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
  }): Promise<unknown> {
    const data: Record<string, string> = {};
    if (options.revoke) {
      // Any non-empty string revokes the privilege
      data.revoke = 'true';
    }
    // If revoke is not set or false, the privilege is granted (no parameter needed)

    const params: Record<string, number> = {};
    if (options.faction_id !== undefined) {
      params.faction_id = options.faction_id;
    }

    return this.http.post<unknown>(
      `/character/${options.uid}/privileges/${options.privilegeGroup}/${options.privilege}`,
      data,
      { params }
    );
  }
}

/**
 * Character credits resource
 *
 * @see https://www.swcombine.com/ws/v2.0/documentation/character/uid/credits/ SW Combine API Documentation
 */
export class CharacterCreditsResource extends BaseResource {
  /**
   * Get character's credit balance
   * @requires_auth Yes
   * @requires_scope CHARACTER_CREDITS
   * @returns Credit balance as a plain number
   * @example
   * const credits = await client.character.credits.get({ uid: '1:12345' });
   * console.log(`Credits: ${credits}`); // Credits: 320089347
   */
  async get(options: GetCharacterCreditsOptions): Promise<number> {
    return this.request<number>('GET', `/character/${options.uid}/credits`);
  }

  /**
   * Transfer credits from character to another character or faction
   * @param options.uid - Character UID
   * @param options.amount - Amount to transfer
   * @param options.recipient - Recipient character or faction name/UID (REQUIRED)
   * @param options.reason - Reason for transfer (optional, API will auto-append client name)
   * @requires_auth Yes
   * @requires_scope CHARACTER_CREDITS_WRITE
   */
  async transfer(options: {
    uid: string;
    amount: number;
    recipient: string;
    reason?: string;
  }): Promise<unknown> {
    const data: Record<string, unknown> = {
      amount: options.amount,
      recipient: options.recipient,
    };

    if (options.reason) {
      data.reason = options.reason;
    }

    return this.request<unknown>('POST', `/character/${options.uid}/credits`, data);
  }
}

/**
 * Character credit log resource
 *
 * @see https://www.swcombine.com/ws/v2.0/documentation/character/uid/creditlog/ SW Combine API Documentation
 */
export class CharacterCreditlogResource extends BaseResource {
  /**
   * Get character's credit log (paginated)
   *
   * @requires_auth Yes
   * @requires_scope CHARACTER_CREDITS
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
    const response = await this.http.get<{ transaction?: CreditLogEntry[]; attributes?: unknown }>(`/character/${options.uid}/creditlog`, { params });
    // API returns { swcapi: { transactions: { attributes: {...}, transaction: [...] } } }
    // HttpClient unwraps to { attributes: {...}, transaction: [...] }
    return response.transaction || [];
  }
}

/**
 * Character permission scope entry
 */
export interface CharacterPermissionEntry {
  scopes: {
    scope: string[];
  };
  attributes: {
    expires: number;
  };
}

/**
 * Character permissions response from API
 */
export interface CharacterPermissionsResponse {
  permission: CharacterPermissionEntry[];
}

/**
 * Character permissions resource
 *
 * @see https://www.swcombine.com/ws/v2.0/documentation/character/uid/permissions/ SW Combine API Documentation
 */
export class CharacterPermissionsResource extends BaseResource {
  /**
   * Get permissions granted to API client for this character
   * @returns Full permissions response with scopes and expiration
   * @example
   * const perms = await client.character.permissions.list({ uid: '1:12345' });
   * const scopes = perms.permission[0]?.scopes.scope || [];
   * console.log('Granted scopes:', scopes.join(', '));
   */
  async list(options: GetCharacterPermissionsOptions): Promise<CharacterPermissionsResponse> {
    return this.request<CharacterPermissionsResponse>('GET', `/character/${options.uid}/permissions`);
  }

  /**
   * Get flat list of granted scope names
   * @returns Array of scope strings (e.g., ['CHARACTER_READ', 'MESSAGES_SEND'])
   */
  async getScopes(options: GetCharacterPermissionsOptions): Promise<string[]> {
    const response = await this.list(options);
    return response.permission?.[0]?.scopes?.scope || [];
  }
}

/**
 * Character resource for managing characters
 *
 * @see https://www.swcombine.com/ws/v2.0/documentation/character/uid/ SW Combine API Documentation
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
  async me(): Promise<CharacterMe> {
    return this.request<CharacterMe>('GET', '/character/');
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
      const scopes = await this.permissions.getScopes({ uid: options.uid });
      return scopes.includes(options.permission);
    } catch (error) {
      // If we can't fetch permissions, assume we don't have access
      return false;
    }
  }
}
