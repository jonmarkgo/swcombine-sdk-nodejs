# OAuth Scopes - Quick Start

## Problem Solved

Before: Hard-coded scope strings prone to typos
```typescript
// ❌ Old way - error-prone
const scopes = [
  'CHARACTER_READ',
  'CHARCTER_STATS',  // Typo! OAuth will fail
  'character_skills', // Wrong case! OAuth will fail
];
```

After: Type-safe constants with autocomplete
```typescript
// ✅ New way - type-safe with autocomplete
import { CharacterScopes, MessageScopes } from 'swcombine-sdk';

const scopes = [
  CharacterScopes.READ,   // TypeScript autocomplete suggests all scopes
  CharacterScopes.STATS,  // Typos caught at compile time
  CharacterScopes.SKILLS, // Correct format guaranteed
  MessageScopes.READ,
  MessageScopes.SEND,
];
```

## Common Patterns

### Pattern 1: Minimal Authentication
```typescript
import { getMinimalScopes } from 'swcombine-sdk';

const authUrl = client.auth.getAuthorizationUrl({
  scopes: getMinimalScopes(), // Just auth + basic info
  state: 'random-state',
});
```

### Pattern 2: Read-Only Dashboard
```typescript
import { getReadOnlyScopes } from 'swcombine-sdk';

const authUrl = client.auth.getAuthorizationUrl({
  scopes: getReadOnlyScopes(), // No write permissions
  state: 'random-state',
});
```

### Pattern 3: Specific Permissions
```typescript
import { CharacterScopes, MessageScopes, Scopes } from 'swcombine-sdk';

const authUrl = client.auth.getAuthorizationUrl({
  scopes: [
    // Character
    CharacterScopes.READ,
    CharacterScopes.STATS,

    // Messages
    MessageScopes.READ,
    MessageScopes.SEND,

    // Inventory
    Scopes.PersonalInventory.SHIPS.READ,
    Scopes.PersonalInventory.SHIPS.RENAME,
  ],
  state: 'random-state',
});
```

### Pattern 4: All Scopes (Testing)
```typescript
import { getAllScopes } from 'swcombine-sdk';

const authUrl = client.auth.getAuthorizationUrl({
  scopes: getAllScopes(), // All 230+ scopes
  state: 'random-state',
});
```

## Explore with Autocomplete

Type `CharacterScopes.` and your IDE will show:
- `AUTH` - Character identity only
- `READ` - Basic character info
- `STATS` - HP and XP
- `SKILLS` - Character skills
- `CREDITS` - Credit info (read)
- `CREDITS_WRITE` - Transfer credits
- `FORCE` - Force powers info
- `LOCATION` - In-game location
- `EVENTS` - Character events
- `ALL` - All character permissions

Type `Scopes.PersonalInventory.` to explore inventory scopes:
- `SHIPS.READ`, `SHIPS.RENAME`, `SHIPS.ALL`
- `VEHICLES.READ`, `VEHICLES.RENAME`, `VEHICLES.ALL`
- `STATIONS.READ`, `STATIONS.RENAME`, `STATIONS.ALL`
- And more...

## See Full Documentation

For complete documentation, see [docs/SCOPES.md](./docs/SCOPES.md)

For examples, see [examples/oauth-scopes-example.ts](./examples/oauth-scopes-example.ts)
