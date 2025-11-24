/**
 * Character resource for accessing character data
 */

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
  MessageMode,
} from '../types/index.js';

export interface Privilege {
  name: string;
  granted: boolean;
  [key: string]: any;
}

export interface Credits {
  amount: number;
  [key: string]: any;
}

export interface CreditLogEntry {
  timestamp: string;
  amount: number;
  balance: number;
  description?: string;
  [key: string]: any;
}

/**
 * Character messages resource
 */
export class CharacterMessagesResource extends BaseResource {
  /**
   * List messages sent or received by character
   */
  async list(options: ListMessagesOptions): Promise<Message[]> {
    return this.request<Message[]>('GET', `/character/${options.uid}/messages/${options.mode}`);
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
   */
  async create(options: CreateMessageOptions): Promise<Message> {
    return this.request<Message>('PUT', `/character/${options.uid}/messages/sent`, {
      recipient: options.recipient,
      subject: options.subject,
      body: options.body,
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
   * Get or update a specific privilege
   */
  async get(options: {
    uid: string;
    privilegeGroup: string;
    privilege: string;
  }): Promise<Privilege> {
    return this.request<Privilege>(
      'GET',
      `/character/${options.uid}/privileges/${options.privilegeGroup}/${options.privilege}`
    );
  }

  /**
   * Update a specific privilege
   */
  async update(options: {
    uid: string;
    privilegeGroup: string;
    privilege: string;
    value: boolean;
  }): Promise<Privilege> {
    return this.request<Privilege>(
      'POST',
      `/character/${options.uid}/privileges/${options.privilegeGroup}/${options.privilege}`,
      { value: options.value }
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
   */
  async update(options: { uid: string; amount: number; recipient?: string }): Promise<Credits> {
    return this.request<Credits>('POST', `/character/${options.uid}/credits`, {
      amount: options.amount,
      recipient: options.recipient,
    });
  }
}

/**
 * Character credit log resource
 */
export class CharacterCreditlogResource extends BaseResource {
  /**
   * Get character's credit log
   */
  async list(options: GetCharacterCreditlogOptions): Promise<CreditLogEntry[]> {
    return this.request<CreditLogEntry[]>('GET', `/character/${options.uid}/creditlog`);
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

  constructor(http: any) {
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
   * Requires authentication
   * @returns The authenticated character's full profile
   */
  async me(): Promise<Character> {
    return this.request<Character>('GET', '/character/');
  }

  /**
   * Get character by UID
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
}
