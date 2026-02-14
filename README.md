# SW Combine SDK for Node.js

<div align="center">

**Comprehensive TypeScript SDK for the Star Wars Combine API v2.0**

[![npm version](https://img.shields.io/npm/v/swcombine-sdk.svg)](https://www.npmjs.com/package/swcombine-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[Features](#features) •
[Installation](#installation) •
[Quick Start](#quick-start) •
[Documentation](#documentation) •
[Examples](#examples)

</div>

## Features

- **Full API Coverage** - All 60+ endpoints across 11 resource categories
- **OAuth 2.0 Built-in** - Complete OAuth flow with automatic token refresh
- **TypeScript First** - Full type definitions with IntelliSense support
- **Type-Safe Scopes** - 170+ OAuth scope constants with autocomplete
- **Automatic Retries** - Exponential backoff for failed requests
- **Modern & Universal** - ES Modules + CommonJS, Node.js 18+
- **Developer Tools** - Helper scripts for OAuth and testing
- **Zero Dependencies** (except axios)

## Installation

```bash
npm install swcombine-sdk
# or
yarn add swcombine-sdk
# or
pnpm add swcombine-sdk
```

## Quick Start

### 1. Initialize the Client

```typescript
import { SWCombine } from 'swcombine-sdk';

// Public mode (no auth)
const publicClient = new SWCombine();

// Token-only mode (use an existing token)
const tokenClient = new SWCombine({
  token: process.env.SWC_ACCESS_TOKEN!,
});

// Full OAuth mode (required for OAuth flows and token refresh)
const fullClient = new SWCombine({
  clientId: process.env.SWC_CLIENT_ID!,
  clientSecret: process.env.SWC_CLIENT_SECRET!,
  token: process.env.SWC_ACCESS_TOKEN, // Optional - string or OAuthToken object
  redirectUri: 'http://localhost:3000/callback',
  accessType: 'offline',
});
```

### 2. Make API Calls

```typescript
// Get public character information (no auth required)
const character = await publicClient.character.getByHandle({
  handle: 'character-handle',
});

console.log(character.uid);    // "1:12345"
console.log(character.name);   // "Character Name"
```

### 3. Authenticated Endpoints

```typescript
// For authenticated endpoints, provide an access token
const authenticatedClient = new SWCombine({
  token: process.env.SWC_ACCESS_TOKEN!,
});

// Get character details
const character = await authenticatedClient.character.get({
  uid: '1:12345',
});

// Get character messages
const messages = await authenticatedClient.character.messages.list({
  uid: '1:12345',
  mode: 'received',
});

// Get faction information
const faction = await authenticatedClient.faction.get({
  uid: '20:123',
});
```

## OAuth Authentication

### Quick OAuth Setup

Use the included helper script to get an access token:

```bash
# 1. Add your credentials to .env
echo "SWC_CLIENT_ID=your_client_id" >> .env
echo "SWC_CLIENT_SECRET=your_client_secret" >> .env

# 2. Run the OAuth helper
npm run get-token

# 3. Visit http://localhost:3000 in your browser
# 4. Authorize the app and copy the token to .env
```

### Manual OAuth Flow

OAuth-only methods require full OAuth mode (`clientId` + `clientSecret`):
- `client.auth.getAuthorizationUrl(...)`
- `client.auth.handleCallback(...)`
- `client.auth.revokeToken(...)`
- `client.refreshToken()`

```typescript
import { SWCombine, CharacterScopes, MessageScopes } from 'swcombine-sdk';

const client = new SWCombine({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  redirectUri: 'http://localhost:3000/callback',
  accessType: 'offline', // Get refresh token
});

// 1. Generate authorization URL
const authUrl = client.auth.getAuthorizationUrl({
  scopes: [
    CharacterScopes.READ,
    CharacterScopes.STATS,
    MessageScopes.READ,
    MessageScopes.SEND,
  ],
  state: 'random-csrf-token',
});

// 2. Redirect user to authUrl...

// 3. Handle callback
const result = await client.auth.handleCallback(req.query);

if (result.success) {
  const token = result.token!;
  console.log('Access Token:', token.accessToken);
  console.log('Refresh Token:', token.refreshToken);
}
```

## Type-Safe OAuth Scopes

```typescript
import {
  CharacterScopes,
  MessageScopes,
  Scopes,
  getAllScopes,
  getReadOnlyScopes,
} from 'swcombine-sdk';

// Use constants with autocomplete
const scopes = [
  CharacterScopes.READ,      // TypeScript suggests all scopes
  CharacterScopes.STATS,
  MessageScopes.SEND,
  Scopes.PersonalInventory.SHIPS.READ,
];

// Or use helpers
const readOnly = getReadOnlyScopes();
const everything = getAllScopes();
```

See [OAuth Scopes Guide](docs/SCOPES.md) for all 170+ available scopes.

## API Resources

The SDK provides access to all SW Combine API resources:

### API Utilities

```typescript
// Get list of available API resources
await client.api.getResources();

// Test connectivity
await client.api.helloWorld();
await client.api.helloAuth(); // Requires authentication

// Get available permissions and rate limits
await client.api.permissions();
await client.api.rateLimits();

// Time conversion (CGT = Combine Galactic Time)
await client.api.time(); // Current time: { years, days, hours, mins, secs }
await client.api.time({ cgt: 'Y26D100' }); // CGT to Unix timestamp
await client.api.time({ time: 1701432000 }); // Unix timestamp to CGT
```

### Timestamp Utility (CGT)

```typescript
import { Timestamp } from 'swcombine-sdk';

// Get current CGT
const now = Timestamp.now();

// Create from Unix timestamp (seconds or milliseconds)
const fromUnix = Timestamp.fromUnixTimestamp(1701432000);

// Create from Date
const fromDate = Timestamp.fromDate(new Date('2025-01-01T00:00:00Z'));

// Add or subtract CGT duration
const plus = fromUnix.add({ days: 2, hours: 3 });
const minus = fromUnix.subtract({ minutes: 30 });

// Format output
now.toString('full'); // "Year 27 Day 134, 8:45:23"
now.toString('{hms} on Day {d} of Year {y}'); // "08:45:23 on Day 134 of Year 27"
```

### Characters

```typescript
// Public endpoints
await client.character.getByHandle({ handle: 'character-handle' });

// Authenticated endpoints
await client.character.me(); // Get authenticated user's character
await client.character.get({ uid: '1:12345' });
await client.character.skills.list({ uid: '1:12345' });
await client.character.privileges.list({ uid: '1:12345' });
await client.character.privileges.get({ uid: '1:12345', privilegeGroup: 'group', privilege: 'name' });
await client.character.credits.get({ uid: '1:12345' }); // Returns credit balance as number
await client.character.credits.transfer({ uid: '1:12345', amount: 1000, recipient: '1:67890' });
await client.character.creditlog.list({ uid: '1:12345' });
await client.character.permissions.list({ uid: '1:12345' });
await client.character.hasPermission({ uid: '1:12345', permission: 'CHARACTER_READ' });

// Messages
await client.character.messages.list({ uid: '1:12345' }); // All messages (sent + received)
await client.character.messages.list({ uid: '1:12345', mode: 'received' }); // Only received
await client.character.messages.list({ uid: '1:12345', mode: 'sent' }); // Only sent
await client.character.messages.get({ uid: '1:12345', messageId: 'msg-123' });
await client.character.messages.create({ uid: '1:12345', receivers: 'recipient1;recipient2', communication: 'Hello!' });
await client.character.messages.delete({ uid: '1:12345', messageId: 'msg-123' });
```

### Factions

```typescript
await client.faction.list();
await client.faction.get({ uid: '20:123' });
await client.faction.members.list({ factionId: '20:123' });
await client.faction.budgets.list({ factionId: '20:123' });
await client.faction.budgets.get({ factionId: '20:123', budgetId: 'budget-uid' });
await client.faction.stockholders.list({ factionId: '20:123' });
await client.faction.credits.get({ factionId: '20:123' });
await client.faction.credits.update({ factionId: '20:123', amount: 1000, recipient: '1:12345' });
await client.faction.creditlog.list({ factionId: '20:123' });
```

### Inventory

```typescript
await client.inventory.get({ uid: '1:12345' });
await client.inventory.entities.list({
  uid: '1:12345',
  entityType: 'ships', // ships, vehicles, stations, cities, facilities, planets, items, npcs, droids, creatures, materials
  assignType: 'owner', // owner, commander, pilot
});
await client.inventory.entities.get({ entityType: 'ships', uid: '5:12345' });

// Entity management
await client.inventory.entities.updateProperty({
  entityType: 'ships',
  uid: '5:12345',
  property: 'name', // name, owner, commander, pilot, infotext, etc.
  new_value: 'New Ship Name',
});
await client.inventory.entities.addTag({ entityType: 'ships', uid: '5:12345', tag: 'favorite' });
await client.inventory.entities.removeTag({ entityType: 'ships', uid: '5:12345', tag: 'favorite' });
```

### Galaxy

```typescript
// Systems, planets, sectors
const systems = await client.galaxy.systems.list();
if (systems.length > 0) {
  console.log(systems[0].attributes.uid, systems[0].attributes.name);
}
const rawSectors = await client.galaxy.sectors.listRaw({ start_index: 1, item_count: 10 });
console.log(rawSectors.attributes?.start, rawSectors.attributes?.count, rawSectors.attributes?.total);
console.log(rawSectors.sector?.[0]?.attributes.name);
await client.galaxy.systems.get({ uid: '24:123' });
await client.galaxy.planets.list();
await client.galaxy.planets.get({ uid: '23:456' });
await client.galaxy.sectors.list();
await client.galaxy.sectors.get({ uid: 'seswenna' }); // Use lowercase sector name

// Stations and cities
await client.galaxy.stations.list();
await client.galaxy.stations.get({ uid: '6:789' });
await client.galaxy.cities.list();
await client.galaxy.cities.get({ uid: '22:101' });
```

### Events

```typescript
// Note: Events uses 0-based indexing unlike other endpoints
await client.events.list({ eventMode: 'personal' }); // personal, faction, inventory, combat
await client.events.list({ eventMode: 'personal', start_index: 0, item_count: 100 }); // omit eventType to get all
await client.events.list({ eventMode: 'personal', eventType: 'xp' }); // filter by specific type
await client.events.get({ uid: 'event-uid' });
```

### Location

```typescript
await client.location.get({ entityType: 'characters', uid: '1:12345' });
await client.location.get({ entityType: 'ships', uid: '5:12345' });
```

### Datacards

```typescript
await client.datacard.list({ factionId: '20:123' });
await client.datacard.get({ uid: 'datacard-uid' });
await client.datacard.create({ uid: 'datacard-uid', production_entity_uid: '6:789', uses: 10 });
await client.datacard.delete({ uid: 'datacard-uid', production_entity_uid: '6:789' });
```

### Market

```typescript
await client.market.vendors.list();
await client.market.vendors.get({ uid: 'vendor-uid' });
```

### News

```typescript
// Galactic News Service (GNS)
await client.news.gns.list();
await client.news.gns.list({ category: 'economy', search: 'battle', author: 'John Doe' });
await client.news.gns.get({ id: 'news-id' });

// Sim News
await client.news.simNews.list();
await client.news.simNews.list({ category: 'player' });
await client.news.simNews.get({ id: 'news-id' });
```

### Types

```typescript
// List all entity types
await client.types.listEntityTypes();

// Get entity classes for a specific type
await client.types.classes.list({ entityType: 'vehicles' });
await client.types.classes.list({ entityType: 'ships' });

// Get entities by type
await client.types.entities.list({ entityType: 'ships' });
await client.types.entities.list({ entityType: 'ships', class: 'fighter' });
await client.types.entities.get({ entityType: 'ships', uid: 'type-uid' });

// Get entities by type with pagination metadata
const rawVehicles = await client.types.entities.listRaw({
  entityType: 'vehicles',
  start_index: 1,
  item_count: 50,
});

// listRaw() is normalized for all entity types:
// { attributes?: { start, total, count }, items: TypesEntityListItem[] }
console.log(rawVehicles.attributes?.start, rawVehicles.attributes?.count, rawVehicles.attributes?.total);
console.log(rawVehicles.items[0]?.attributes.uid, rawVehicles.items[0]?.value);
```

See [API Documentation](docs/API.md) for complete reference.

## Rate Limiting

The SW Combine API has a rate limit of **600 requests per hour**. The SDK provides tools to monitor and handle rate limits:

```typescript
// Check current rate limit status after any API call
const rateLimit = client.getRateLimitInfo();
if (rateLimit) {
  console.log(`${rateLimit.remaining}/${rateLimit.limit} requests remaining`);
  console.log(`Resets at: ${rateLimit.resetTime}`);
}

// Set up a callback to monitor rate limits in real-time
client.onRateLimitUpdate((info) => {
  if (info.remaining < 100) {
    console.warn(`Warning: Only ${info.remaining} API requests remaining!`);
  }
});

// Or check via API endpoint for detailed per-endpoint limits
const limits = await client.api.rateLimits();
```

The SDK automatically handles rate limit errors with exponential backoff and respects the `Retry-After` header when provided.

## Error Handling

```typescript
import { SWCError } from 'swcombine-sdk';

try {
  const character = await client.character.get({ uid: '1:12345' });
} catch (error) {
  if (error instanceof SWCError) {
    console.error('Status:', error.statusCode);     // 404
    console.error('Message:', error.message);       // "Resource not found"
    console.error('Type:', error.type);             // "not_found"
    console.error('Retryable:', error.retryable);   // false
  }
}
```

## TypeScript Support

Full TypeScript support with intelligent type inference:

```typescript
// Types are automatically inferred
const character = await client.character.get({ uid: '1:12345' });
// character: Character

// Request parameters are typed
await client.character.messages.list({
  uid: '1:12345',
  mode: 'received', // Optional - TypeScript knows valid values: 'sent' | 'received'
  // mode: 'invalid', // TypeScript error
});
```

## Configuration Options

```typescript
interface ClientConfig {
  // Optional OAuth credentials
  // If provided, both must be set together
  clientId?: string;
  clientSecret?: string;

  // Optional authentication - string or full OAuthToken object
  token?: string | OAuthToken;

  // Optional OAuth settings
  redirectUri?: string;
  accessType?: 'online' | 'offline';

  // Optional HTTP settings
  baseURL?: string;           // Default: https://www.swcombine.com/ws/v2.0/
  timeout?: number;           // Default: 30000 (30 seconds)
  maxRetries?: number;        // Default: 3
  retryDelay?: number;        // Default: 1000ms
  debug?: boolean;            // Default: false
}

interface OAuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;          // Timestamp in milliseconds
}
```

## Examples

See the [examples](examples/) directory for complete working examples:

- **[OAuth Scopes](examples/oauth-scopes-example.ts)** - 10 examples of scope usage

### Basic Usage

```typescript
import { SWCombine } from 'swcombine-sdk';

const client = new SWCombine();

// Get character info
const character = await client.character.getByHandle({
  handle: 'character-name',
});

console.log(`${character.name} (${character.uid})`);
```

## Developer Tools

### Get OAuth Token

Interactive OAuth flow to obtain access tokens:

```bash
npm run get-token
```

### Get Character UID

Quickly get a character's UID from their handle:

```bash
npm run get-character-uid YourHandle
```

### Run Integration Tests

```bash
npm run test:integration
```

## Documentation

- **[Getting Started Guide](docs/GETTING_STARTED.md)** - Detailed setup and usage
- **[Authentication Guide](docs/AUTHENTICATION.md)** - OAuth 2.0 setup and token management
- **[OAuth Scopes Reference](docs/SCOPES.md)** - Complete scope documentation
- **[API Reference](docs/API.md)** - Detailed API endpoint documentation
- **[Examples](examples/)** - Working code examples

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run integration tests
npm run test:integration

# Lint
npm run lint

# Format code
npm run format
```

## Requirements

- Node.js 18 or higher
- TypeScript 5.0 or higher (for TypeScript projects)

## Links

- [SW Combine API Documentation](https://www.swcombine.com/ws/developers/)
- [npm Package](https://www.npmjs.com/package/swcombine-sdk)
- [GitHub Repository](https://github.com/yourusername/swcombine-sdk-nodejs)

## License

MIT © Dreks Selmur aka JonMarkGo

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

- Check the [documentation](docs/)
- Submit issues on [GitHub](https://github.com/yourusername/swcombine-sdk-nodejs/issues)
- Contact support

---

<div align="center">
Made for the Star Wars Combine community
</div>
