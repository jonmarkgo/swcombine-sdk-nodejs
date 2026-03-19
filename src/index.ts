/**
 * SW Combine SDK for Node.js
 * Main entry point
 */

// Main client
export { SWCombine } from './SWCombine.js';

// Error handling
export { SWCError } from './http/errors.js';

// Utilities
export { Timestamp } from './Timestamp.js';

// Pagination
export { Page } from './pagination/Page.js';

// Types
export * from './types/index.js';

// OAuth scopes (type-safe, lowercase values as required by the API)
export {
  Scopes,
  CharacterScopes,
  MessageScopes,
  PersonalInventoryScopes,
  FactionScopes,
  FactionInventoryScopes,
  getAllScopes,
  getAllCharacterScopes,
  getAllMessageScopes,
  getAllPersonalInventoryScopes,
  getAllFactionScopes,
  getAllFactionInventoryScopes,
  getReadOnlyScopes,
  getMinimalScopes,
} from './auth/scopes.js';

// Auth types
export type { TokenStorage } from './auth/TokenManager.js';
