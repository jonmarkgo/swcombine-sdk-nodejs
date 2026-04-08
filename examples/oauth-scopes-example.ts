/**
 * OAuth Scopes Example
 *
 * This example demonstrates how to use the scope helpers to request
 * different combinations of OAuth permissions.
 */

import {
  SWCombine,
  Scopes,
  CharacterScopes,
  MessageScopes,
  getReadOnlyScopes,
  getMinimalScopes,
  getAllScopes,
  getAllCharacterScopes,
} from '../src/index.js';
import type { AllScopes } from '../src/index.js';

// Initialize SDK
const client = new SWCombine({
  clientId: process.env.SWC_CLIENT_ID!,
  clientSecret: process.env.SWC_CLIENT_SECRET!,
  redirectUri: 'http://localhost:3000/callback',
});

/**
 * Example 1: Request minimal scopes (just auth + basic character info)
 * Good for: Login/authentication only
 */
function example1_MinimalScopes() {
  const authUrl = client.auth.getAuthorizationUrl({
    scopes: getMinimalScopes(),
    state: 'random-state',
  });

  console.log('Minimal scopes:', getMinimalScopes());
  // Output: ['CHARACTER_AUTH', 'CHARACTER_READ']
}

/**
 * Example 2: Request read-only scopes
 * Good for: Analytics, dashboards, read-only integrations
 */
function example2_ReadOnlyScopes() {
  const authUrl = client.auth.getAuthorizationUrl({
    scopes: getReadOnlyScopes(),
    state: 'random-state',
  });

  console.log('Read-only scopes count:', getReadOnlyScopes().length);
  // Includes character read, stats, skills, credits, messages read, etc.
}

/**
 * Example 3: Request specific character permissions using constants
 * Good for: Character-focused applications with autocomplete
 */
function example3_SpecificCharacterScopes() {
  const authUrl = client.auth.getAuthorizationUrl({
    scopes: [
      CharacterScopes.READ,      // Basic info (with autocomplete!)
      CharacterScopes.STATS,     // HP and XP
      CharacterScopes.SKILLS,    // Skills
      CharacterScopes.LOCATION,  // Location
      MessageScopes.READ,        // Read messages
      MessageScopes.SEND,        // Send messages
    ],
    state: 'random-state',
  });

  console.log('✓ TypeScript autocomplete helps prevent typos!');
}

/**
 * Example 4: Request all character-related scopes
 * Good for: Character management tools
 */
function example4_AllCharacterScopes() {
  const authUrl = client.auth.getAuthorizationUrl({
    scopes: getAllCharacterScopes(),
    state: 'random-state',
  });

  console.log('All character scopes count:', getAllCharacterScopes().length);
  // Includes all CHARACTER_* scopes
}

/**
 * Example 5: Request specific inventory permissions
 * Good for: Fleet management, asset tracking
 */
function example5_InventoryScopes() {
  const authUrl = client.auth.getAuthorizationUrl({
    scopes: [
      // Personal ship permissions
      Scopes.PersonalInventory.SHIPS.READ,
      Scopes.PersonalInventory.SHIPS.RENAME,
      Scopes.PersonalInventory.SHIPS.ASSIGN,

      // Personal vehicle permissions
      Scopes.PersonalInventory.VEHICLES.READ,
      Scopes.PersonalInventory.VEHICLES.ALL, // Or request all at once
    ],
    state: 'random-state',
  });

  console.log('✓ Organized by category with dot notation');
}

/**
 * Example 6: Request faction management permissions
 * Good for: Faction management tools
 */
function example6_FactionScopes() {
  const authUrl = client.auth.getAuthorizationUrl({
    scopes: [
      Scopes.Faction.READ,
      Scopes.Faction.MEMBERS,
      Scopes.Faction.CREDITS_READ,
      Scopes.FactionInventory.OVERVIEW,
      Scopes.FactionInventory.SHIPS.READ,
    ],
    state: 'random-state',
  });

  console.log('✓ Separate faction and faction inventory scopes');
}

/**
 * Example 7: Request all scopes (for testing/development)
 * Good for: Integration tests, SDK development
 */
function example7_AllScopes() {
  const authUrl = client.auth.getAuthorizationUrl({
    scopes: getAllScopes(),
    state: 'random-state',
  });

  console.log('All available scopes count:', getAllScopes().length);
  // Returns 230+ scopes covering all API permissions
}

/**
 * Example 8: Mix and match specific scopes
 * Good for: Custom integrations with specific needs
 */
function example8_CustomCombination() {
  const authUrl = client.auth.getAuthorizationUrl({
    scopes: [
      // Character basics
      CharacterScopes.READ,
      CharacterScopes.STATS,

      // Messaging
      MessageScopes.READ,
      MessageScopes.SEND,

      // Specific inventory items
      Scopes.PersonalInventory.SHIPS.READ,
      Scopes.PersonalInventory.VEHICLES.READ,

      // Faction info (if in a faction)
      Scopes.Faction.READ,
      Scopes.Faction.MEMBERS,
    ],
    state: 'random-state',
  });

  console.log('✓ Build exactly the permissions you need');
}

/**
 * Example 9: Using nested scope structure for organization
 */
function example9_NestedStructure() {
  // All scopes are organized in a nested structure
  console.log('Available scope categories:');
  console.log('- Scopes.Character.*');
  console.log('- Scopes.Messages.*');
  console.log('- Scopes.PersonalInventory.*');
  console.log('- Scopes.Faction.*');
  console.log('- Scopes.FactionInventory.*');

  // Example: Get all permissions for personal ships
  const shipScopes = Object.values(Scopes.PersonalInventory.SHIPS);
  console.log('\nAll ship scopes:', shipScopes);
  // ['PERSONAL_INV_SHIPS_READ', 'PERSONAL_INV_SHIPS_RENAME', ...]
}

/**
 * Example 10: Type-safe scope usage in TypeScript
 */
function example10_TypeSafety() {
  // Typing as AllScopes[] gives you a precise union of every valid scope
  // literal — autocomplete across all categories, and arbitrary strings
  // are rejected at compile time.
  const scopes: AllScopes[] = [
    CharacterScopes.READ,         // ✓ Autocomplete suggests all character scopes
    MessageScopes.SEND,            // ✓ Autocomplete suggests all message scopes
    // CharacterScopes.TYPO,       // ✗ TypeScript error - property doesn't exist
    // 'not_a_real_scope',          // ✗ TypeScript error - not in AllScopes union
  ];

  const authUrl = client.auth.getAuthorizationUrl({
    scopes,
    state: 'random-state',
  });

  console.log('✓ TypeScript catches typos at compile time!');
}

// Run examples
console.log('\n=== OAuth Scopes Examples ===\n');
example1_MinimalScopes();
console.log('');
example2_ReadOnlyScopes();
console.log('');
example3_SpecificCharacterScopes();
console.log('');
example4_AllCharacterScopes();
console.log('');
example5_InventoryScopes();
console.log('');
example6_FactionScopes();
console.log('');
example7_AllScopes();
console.log('');
example8_CustomCombination();
console.log('');
example9_NestedStructure();
console.log('');
example10_TypeSafety();
