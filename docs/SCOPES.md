# OAuth Scopes Guide

The SW Combine SDK provides a comprehensive scopes system to help you request the right OAuth permissions for your application.

## Why Use Scope Constants?

1. **Type Safety**: TypeScript autocomplete prevents typos
2. **Discoverability**: Browse available permissions with IDE autocomplete
3. **Organization**: Scopes grouped by resource type
4. **Maintainability**: Update scope names in one place
5. **Documentation**: Built-in JSDoc comments explain each scope

## Quick Start

```typescript
import { SWCombine, CharacterScopes, MessageScopes } from 'swcombine-sdk';

const client = new SWCombine({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  redirectUri: 'http://localhost:3000/callback',
});

// Request specific scopes with autocomplete
const authUrl = client.auth.getAuthorizationUrl({
  scopes: [
    CharacterScopes.READ,      // Basic character info
    CharacterScopes.STATS,     // HP and XP
    CharacterScopes.SKILLS,    // Skills
    MessageScopes.READ,        // Read messages
    MessageScopes.SEND,        // Send messages
  ],
  state: 'random-state-string',
});
```

## Scope Categories

### Character Scopes

Access character information and actions:

```typescript
import { CharacterScopes } from 'swcombine-sdk';

CharacterScopes.AUTH           // Character name and ID only (for identity verification)
CharacterScopes.READ           // Basic info: UID, handle, image, race, gender
CharacterScopes.STATS          // HP and XP
CharacterScopes.PRIVILEGES     // Character privileges
CharacterScopes.SKILLS         // Character skills
CharacterScopes.CREDITS        // Credit information (read-only)
CharacterScopes.CREDITS_WRITE  // Transfer credits
CharacterScopes.FORCE          // Force-related info (FP, FXP, etc.)
CharacterScopes.LOCATION       // In-game location
CharacterScopes.EVENTS         // Character events
CharacterScopes.ALL            // All character permissions
```

### Message Scopes

Access messaging functionality:

```typescript
import { MessageScopes } from 'swcombine-sdk';

MessageScopes.READ    // Read messages
MessageScopes.SEND    // Send messages
MessageScopes.DELETE  // Delete messages
MessageScopes.ALL     // All message permissions
```

### Personal Inventory Scopes

Access personal assets:

```typescript
import { Scopes } from 'swcombine-sdk';

// Ships
Scopes.PersonalInventory.SHIPS.READ
Scopes.PersonalInventory.SHIPS.RENAME
Scopes.PersonalInventory.SHIPS.ASSIGN
Scopes.PersonalInventory.SHIPS.MAKEOVER
Scopes.PersonalInventory.SHIPS.TAGS_READ
Scopes.PersonalInventory.SHIPS.TAGS_WRITE
Scopes.PersonalInventory.SHIPS.ALL

// Also available for: VEHICLES, STATIONS, CITIES, FACILITIES,
// PLANETS, ITEMS, NPCS, DROIDS, MATERIALS, CREATURES
```

### Faction Scopes

Access faction information:

```typescript
import { FactionScopes } from 'swcombine-sdk';

FactionScopes.READ             // Read faction info
FactionScopes.MEMBERS          // Read faction members
FactionScopes.STOCKS           // Read faction stocks
FactionScopes.CREDITS_READ     // Read faction credits
FactionScopes.CREDITS_WRITE    // Transfer faction credits
FactionScopes.BUDGETS_READ     // Read faction budgets
FactionScopes.BUDGETS_WRITE    // Write faction budgets
FactionScopes.DATACARDS_READ   // Read faction datacards
FactionScopes.DATACARDS_WRITE  // Write faction datacards
FactionScopes.ALL              // All faction permissions
```

### Faction Inventory Scopes

Access faction assets:

```typescript
import { Scopes } from 'swcombine-sdk';

// Faction ships (similar structure to personal inventory)
Scopes.FactionInventory.SHIPS.READ
Scopes.FactionInventory.SHIPS.RENAME
Scopes.FactionInventory.SHIPS.ALL
// ... and more
```

## Helper Functions

### Get All Scopes

Request all available permissions (useful for testing):

```typescript
import { getAllScopes } from 'swcombine-sdk';

const authUrl = client.auth.getAuthorizationUrl({
  scopes: getAllScopes(), // All 230+ scopes
  state: 'random-state',
});
```

### Get Minimal Scopes

Request just authentication and basic character info:

```typescript
import { getMinimalScopes } from 'swcombine-sdk';

const authUrl = client.auth.getAuthorizationUrl({
  scopes: getMinimalScopes(), // ['CHARACTER_AUTH', 'CHARACTER_READ']
  state: 'random-state',
});
```

### Get Read-Only Scopes

Request read-only permissions (good for analytics/dashboards):

```typescript
import { getReadOnlyScopes } from 'swcombine-sdk';

const authUrl = client.auth.getAuthorizationUrl({
  scopes: getReadOnlyScopes(), // Character read, stats, skills, etc.
  state: 'random-state',
});
```

### Get Category Scopes

Request all scopes for a specific category:

```typescript
import {
  getAllCharacterScopes,
  getAllMessageScopes,
  getAllPersonalInventoryScopes,
  getAllFactionScopes,
  getAllFactionInventoryScopes,
} from 'swcombine-sdk';

// All character-related scopes
const characterScopes = getAllCharacterScopes();

// All message-related scopes
const messageScopes = getAllMessageScopes();

// All personal inventory scopes
const inventoryScopes = getAllPersonalInventoryScopes();
```

## Common Use Cases

### Login/Authentication Only

```typescript
import { getMinimalScopes } from 'swcombine-sdk';

const scopes = getMinimalScopes();
// ['CHARACTER_AUTH', 'CHARACTER_READ']
```

### Character Profile Dashboard

```typescript
import { CharacterScopes } from 'swcombine-sdk';

const scopes = [
  CharacterScopes.READ,
  CharacterScopes.STATS,
  CharacterScopes.SKILLS,
  CharacterScopes.FORCE,
  CharacterScopes.LOCATION,
];
```

### Fleet Management Tool

```typescript
import { Scopes, CharacterScopes } from 'swcombine-sdk';

const scopes = [
  CharacterScopes.READ,
  Scopes.PersonalInventory.OVERVIEW,
  Scopes.PersonalInventory.SHIPS.ALL,
  Scopes.PersonalInventory.VEHICLES.ALL,
];
```

### Faction Management Tool

```typescript
import { Scopes, FactionScopes } from 'swcombine-sdk';

const scopes = [
  FactionScopes.ALL,
  Scopes.FactionInventory.OVERVIEW,
  Scopes.FactionInventory.SHIPS.READ,
  Scopes.FactionInventory.VEHICLES.READ,
];
```

### Comprehensive Integration (Testing)

```typescript
import { getAllScopes } from 'swcombine-sdk';

const scopes = getAllScopes();
// All 230+ available scopes
```

## TypeScript Benefits

The scope constants provide full TypeScript support:

```typescript
import { CharacterScopes, MessageScopes } from 'swcombine-sdk';

// ✓ Autocomplete suggests all available scopes
const scopes = [
  CharacterScopes.   // IDE shows: AUTH, READ, STATS, etc.
  MessageScopes.     // IDE shows: READ, SEND, DELETE, ALL
];

// ✗ TypeScript catches typos at compile time
const invalid = CharacterScopes.TYPO; // Error: Property 'TYPO' does not exist
```

## API Reference

### Scope Constants

- `CharacterScopes` - Character-related scopes
- `MessageScopes` - Message-related scopes
- `PersonalInventoryScopes` - Personal inventory scopes
- `FactionScopes` - Faction management scopes
- `FactionInventoryScopes` - Faction inventory scopes
- `Scopes` - All scopes organized in nested structure

### Helper Functions

- `getAllScopes()` - Returns all 230+ available scopes
- `getMinimalScopes()` - Returns minimal scopes for authentication
- `getReadOnlyScopes()` - Returns read-only scopes
- `getAllCharacterScopes()` - Returns all character scopes
- `getAllMessageScopes()` - Returns all message scopes
- `getAllPersonalInventoryScopes()` - Returns all personal inventory scopes
- `getAllFactionScopes()` - Returns all faction scopes
- `getAllFactionInventoryScopes()` - Returns all faction inventory scopes

## Important Notes

1. **No Scope Inheritance**: The SW Combine API does not support scope inheritance. Requesting `CHARACTER_ALL` does NOT include `CHARACTER_READ` - you must request both if you want comprehensive access.

2. **Request Exact Scopes**: Only request the scopes your application actually needs. Users can see what permissions you're requesting during the OAuth flow.

3. **Token Expiration**: Access tokens typically expire after 1 hour. Use refresh tokens for long-lived access.

4. **Scope Format**: All scopes are UPPERCASE with underscores (e.g., `CHARACTER_READ`, `PERSONAL_INV_SHIPS_ALL`).

## See Also

- [OAuth Authentication Guide](./OAUTH.md)
- [API Reference](./API.md)
- [Examples](../examples/)
