# Getting Started with SW Combine SDK

This guide will help you get up and running with the SW Combine SDK for Node.js in just a few minutes.

## Installation

```bash
npm install swcombine-sdk
# or
yarn add swcombine-sdk
# or
pnpm add swcombine-sdk
```

## Quick Start

### 1. Import and Initialize

```typescript
import { SWCombine, AccessType } from 'swcombine-sdk';

// Public mode (no auth)
const publicClient = new SWCombine();

// Token-only mode
const tokenClient = new SWCombine({
  token: 'your-access-token',
});

// Full OAuth mode
const fullClient = new SWCombine({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  token: 'your-access-token',
  redirectUri: 'http://localhost:3000/callback',
  accessType: AccessType.Offline,
});
```

### 2. Make Your First API Call

```typescript
// Resolve a character handle to a UID (no auth required).
// `getByHandle` returns `{ uid, handle }`; call `character.get()` for the full profile.
const { uid, handle } = await publicClient.character.getByHandle({
  handle: 'character-handle',
});

console.log(uid);    // "1:12345"
console.log(handle); // "character-handle"
```

### 3. Use Authenticated Endpoints

For endpoints requiring authentication, you'll need an access token from OAuth:

```typescript
const client = new SWCombine({
  token: 'your-access-token',
});

// Get authenticated character information
const character = await client.character.get({
  uid: '1:12345',
});

console.log(character.credits);  // 1000000
console.log(character.faction);  // { value: "Faction Name", ... }
```

## Configuration Options

```typescript
interface ClientConfig {
  // Optional OAuth credentials
  // If provided, both must be set together
  clientId?: string;
  clientSecret?: string;

  // Optional authentication
  token?: string | OAuthToken;

  // Optional OAuth settings
  redirectUri?: string;
  accessType?: AccessType;    // AccessType.Online | AccessType.Offline

  // Optional HTTP settings
  baseURL?: string;           // Default: https://www.swcombine.com/ws/v2.0/
  timeout?: number;           // Default: 30000 (30 seconds)
  maxRetries?: number;        // Default: 3
  retryDelay?: number;        // Default: 1000ms
  debug?: boolean;            // Default: false
}
```

### Example with All Options

```typescript
import { SWCombine, AccessType } from 'swcombine-sdk';

const client = new SWCombine({
  // OAuth credentials
  clientId: process.env.SWC_CLIENT_ID!,
  clientSecret: process.env.SWC_CLIENT_SECRET!,
  token: process.env.SWC_ACCESS_TOKEN,

  // OAuth configuration
  redirectUri: 'http://localhost:3000/callback',
  accessType: AccessType.Offline, // Request refresh token

  // HTTP configuration
  timeout: 60000,        // 60 seconds
  maxRetries: 5,         // Retry 5 times on failure
  retryDelay: 2000,      // Wait 2 seconds between retries
  debug: true,           // Log HTTP requests
});
```

## Environment Variables

Best practice is to store credentials in environment variables:

```bash
# .env file
SWC_CLIENT_ID=your_client_id
SWC_CLIENT_SECRET=your_client_secret
SWC_ACCESS_TOKEN=your_access_token
SWC_REFRESH_TOKEN=your_refresh_token
```

```typescript
import { config } from 'dotenv';
config(); // Load .env

const client = new SWCombine({
  clientId: process.env.SWC_CLIENT_ID!,
  clientSecret: process.env.SWC_CLIENT_SECRET!,
  token: process.env.SWC_ACCESS_TOKEN,
});
```

OAuth-only methods require full OAuth mode (`clientId` + `clientSecret`):
- `client.auth.getAuthorizationUrl(...)`
- `client.auth.handleCallback(...)`
- `client.auth.revokeToken(...)`
- `client.refreshToken()`

## Available Resources

The SDK provides access to all major SW Combine API resources:

### Characters
```typescript
// Public endpoints (no auth)
await client.character.getByHandle({ handle: 'character-handle' }); // → { uid, handle }

// Authenticated endpoints
await client.character.me();                                         // current token owner
await client.character.get({ uid: '1:12345' });
await client.character.skills.list({ uid: '1:12345' });
await client.character.privileges.list({ uid: '1:12345' });
await client.character.credits.get({ uid: '1:12345' });
await client.character.creditlog.list({ uid: '1:12345' });
await client.character.messages.list({ uid: '1:12345', mode: MessageMode.Received });
await client.character.permissions.list({ uid: '1:12345' });
```

### Factions
```typescript
// List all factions
await client.faction.list();

// Get specific faction
await client.faction.get({ uid: '20:123' });

// Faction details (requires auth)
await client.faction.members.list({ uid: '20:123' });
await client.faction.budgets.list({ uid: '20:123' });
await client.faction.stockholders.list({ uid: '20:123' });
```

### Inventory
```typescript
// Get inventory
await client.inventory.get({ uid: '1:12345' });

// List entities (returns Page<T>)
// entityType is plural: 'ships' | 'vehicles' | 'stations' | 'cities' | 'facilities'
//   | 'planets' | 'items' | 'npcs' | 'droids' | 'creatures' | 'materials'
await client.inventory.entities.list({
  uid: '1:12345',
  entityType: 'vehicles',
  assignType: 'pilot',
});
```

### Location
```typescript
await client.location.get({
  entityType: 'character',
  uid: '1:12345',
});
```

### Events
```typescript
await client.events.list({
  eventMode: 'character',
  eventType: 'all',
});

await client.events.get({ uid: 'event-uid' });
```

### Datacards
```typescript
await client.datacard.list({ factionId: '20:123' });
```

### Types & Galaxy Info
```typescript
// Entity types — entityType is one of:
// 'ships' | 'vehicles' | 'stations' | 'cities' | 'facilities' | 'planets'
//   | 'items' | 'npcs' | 'droids' | 'creatures' | 'materials' | 'factionmodules'
await client.types.classes.list({ entityType: 'vehicles' });
await client.types.entities.list({ entityType: 'ships' });
await client.types.entities.get({ entityType: 'ships', uid: 'ship-type-uid' });

// Galaxy information (all return Page<T>)
await client.galaxy.systems.list();
await client.galaxy.planets.list();
await client.galaxy.sectors.list();
await client.galaxy.stations.list();
await client.galaxy.cities.list();
```

### Market & News
```typescript
// Market vendors (the only market sub-resource today)
await client.market.vendors.list();
await client.market.vendors.get({ uid: 'vendor-uid' });

// News — Galactic News Service and Sim News are separate feeds
await client.news.gns.list();                       // Page<NewsListItem>
await client.news.gns.get({ id: 49108 });
await client.news.simNews.list({ category: 'player' });
await client.news.simNews.get({ id: 12345 });
```

### API Utilities
```typescript
// Hello world
await client.api.helloWorld();

// Get permissions
await client.api.permissions();

// Get rate limits
await client.api.rateLimits();

// Get current time
await client.api.time();
```

### Timestamp Utility (CGT)
```typescript
import { Timestamp } from 'swcombine-sdk';

const now = Timestamp.now();
const fromUnix = Timestamp.fromUnixTimestamp(1701432000);
const fromDate = Timestamp.fromDate(new Date('2025-01-01T00:00:00Z'));

const plus = fromUnix.add({ days: 2, hours: 3 });
const minus = fromUnix.subtract({ minutes: 30 });

console.log(now.toString('full'));
console.log(now.toString('{hms} on Day {d} of Year {y}'));
```

## Error Handling

The SDK throws typed errors that you can catch and handle:

```typescript
import { SWCError } from 'swcombine-sdk';

try {
  const character = await client.character.get({ uid: '1:12345' });
} catch (error) {
  if (error instanceof SWCError) {
    console.error('Status:', error.statusCode);     // 404
    console.error('Message:', error.message);       // "Resource not found"
    console.error('Type:', error.type);             // "not_found"
    console.error('Request ID:', error.requestId);  // "abc123"
    console.error('Retryable:', error.retryable);   // false
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## TypeScript Support

The SDK is written in TypeScript and provides full type definitions:

```typescript
import { Character, Faction, Message, MessageMode } from 'swcombine-sdk';

// Types are automatically inferred
const character = await client.character.get({ uid: '1:12345' });
// character: Character

// Or explicitly type
const faction: Faction = await client.faction.get({ uid: '20:123' });

// Request parameters are also typed — use the MessageMode enum
await client.character.messages.list({
  uid: '1:12345',
  mode: MessageMode.Received, // TypeScript enforces MessageMode members
  // mode: 'invalid',          // ❌ TypeScript error
});
```

## Next Steps

- **[OAuth Authentication](./AUTHENTICATION.md)** - Set up OAuth and get access tokens
- **[OAuth Scopes](./SCOPES.md)** - Learn about OAuth permissions
- **[v2 → v3 Migration Guide](./MIGRATION-v3.md)** - Upgrading from v2
- **[API Reference](https://jonmarkgo.github.io/swcombine-sdk-nodejs/)** - Full TypeDoc reference
- **[Examples](../examples/)** - Code examples for common tasks

## Need Help?

- Check the [examples](../examples/) directory for working code
- Browse the full [API reference](https://jonmarkgo.github.io/swcombine-sdk-nodejs/)
- Read resource source files in `src/resources/` for method signatures and JSDoc examples
- Submit issues on GitHub
