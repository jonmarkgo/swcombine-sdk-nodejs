# SW Combine SDK for Node.js

<div align="center">

**Comprehensive TypeScript SDK for the Star Wars Combine API v2.0**

[![npm version](https://img.shields.io/npm/v/swcombine-sdk.svg)](https://www.npmjs.com/package/swcombine-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![API Docs](https://img.shields.io/badge/API_Docs-TypeDoc-blue.svg)](https://jonmarkgo.github.io/swcombine-sdk-nodejs/)

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

// List returns metadata items (MessageListItem[])
const firstMessageId = messages[0]?.attributes.uid;
if (firstMessageId) {
  const fullMessage = await authenticatedClient.character.messages.get({
    uid: '1:12345',
    messageId: firstMessageId,
  });
  console.log(fullMessage.communication);
}

// Send a message
// IMPORTANT: use receiver handle(s), not UID(s), for `receivers`
await authenticatedClient.character.messages.create({
  uid: '1:12345',
  receivers: 'recipient_handle',
  communication: 'Test message',
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

The SDK provides access to all SW Combine API v2.0 resources through a fluent, type-safe interface:

| Resource | Access | Description |
|---|---|---|
| [`client.api`](https://jonmarkgo.github.io/swcombine-sdk-nodejs/classes/resources_ApiResource.ApiResource.html) | Utilities | Hello world, permissions, rate limits, time conversion |
| [`client.character`](https://jonmarkgo.github.io/swcombine-sdk-nodejs/classes/resources_CharacterResource.CharacterResource.html) | Characters | Profile, [messages](https://jonmarkgo.github.io/swcombine-sdk-nodejs/classes/resources_CharacterResource.CharacterMessagesResource.html), [skills](https://jonmarkgo.github.io/swcombine-sdk-nodejs/classes/resources_CharacterResource.CharacterSkillsResource.html), [privileges](https://jonmarkgo.github.io/swcombine-sdk-nodejs/classes/resources_CharacterResource.CharacterPrivilegesResource.html), [credits](https://jonmarkgo.github.io/swcombine-sdk-nodejs/classes/resources_CharacterResource.CharacterCreditsResource.html), [credit log](https://jonmarkgo.github.io/swcombine-sdk-nodejs/classes/resources_CharacterResource.CharacterCreditlogResource.html) |
| [`client.faction`](https://jonmarkgo.github.io/swcombine-sdk-nodejs/classes/resources_FactionResource.FactionResource.html) | Factions | Info, [members](https://jonmarkgo.github.io/swcombine-sdk-nodejs/classes/resources_FactionResource.FactionMembersResource.html), [budgets](https://jonmarkgo.github.io/swcombine-sdk-nodejs/classes/resources_FactionResource.FactionBudgetsResource.html), [stockholders](https://jonmarkgo.github.io/swcombine-sdk-nodejs/classes/resources_FactionResource.FactionStockholdersResource.html), [credits](https://jonmarkgo.github.io/swcombine-sdk-nodejs/classes/resources_FactionResource.FactionCreditsResource.html), [credit log](https://jonmarkgo.github.io/swcombine-sdk-nodejs/classes/resources_FactionResource.FactionCreditlogResource.html) |
| [`client.galaxy`](https://jonmarkgo.github.io/swcombine-sdk-nodejs/classes/resources_GalaxyResource.GalaxyResource.html) | Galaxy | [Systems](https://jonmarkgo.github.io/swcombine-sdk-nodejs/classes/resources_GalaxyResource.GalaxySystemsResource.html), [sectors](https://jonmarkgo.github.io/swcombine-sdk-nodejs/classes/resources_GalaxyResource.GalaxySectorsResource.html), [planets](https://jonmarkgo.github.io/swcombine-sdk-nodejs/classes/resources_GalaxyResource.GalaxyPlanetsResource.html), [stations](https://jonmarkgo.github.io/swcombine-sdk-nodejs/classes/resources_GalaxyResource.GalaxyStationsResource.html), [cities](https://jonmarkgo.github.io/swcombine-sdk-nodejs/classes/resources_GalaxyResource.GalaxyCitiesResource.html) |
| [`client.inventory`](https://jonmarkgo.github.io/swcombine-sdk-nodejs/classes/resources_InventoryResource.InventoryResource.html) | Inventory | [Entity listing](https://jonmarkgo.github.io/swcombine-sdk-nodejs/classes/resources_InventoryResource.InventoryEntitiesResource.html), management, tagging |
| [`client.market`](https://jonmarkgo.github.io/swcombine-sdk-nodejs/classes/resources_MarketResource.MarketResource.html) | Market | [Vendor listings](https://jonmarkgo.github.io/swcombine-sdk-nodejs/classes/resources_MarketResource.MarketVendorsResource.html) |
| [`client.news`](https://jonmarkgo.github.io/swcombine-sdk-nodejs/classes/resources_NewsResource.NewsResource.html) | News | [GNS](https://jonmarkgo.github.io/swcombine-sdk-nodejs/classes/resources_NewsResource.GNSResource.html) and [Sim News](https://jonmarkgo.github.io/swcombine-sdk-nodejs/classes/resources_NewsResource.SimNewsResource.html) feeds |
| [`client.types`](https://jonmarkgo.github.io/swcombine-sdk-nodejs/classes/resources_TypesResource.TypesResource.html) | Types | [Entity types](https://jonmarkgo.github.io/swcombine-sdk-nodejs/classes/resources_TypesResource.TypesEntitiesResource.html), [classes](https://jonmarkgo.github.io/swcombine-sdk-nodejs/classes/resources_TypesResource.TypesClassesResource.html), and detailed type info |
| [`client.events`](https://jonmarkgo.github.io/swcombine-sdk-nodejs/classes/resources_EventsResource.EventsResource.html) | Events | Personal, faction, inventory, and combat events |
| [`client.location`](https://jonmarkgo.github.io/swcombine-sdk-nodejs/classes/resources_LocationResource.LocationResource.html) | Location | Entity location lookups |
| [`client.datacard`](https://jonmarkgo.github.io/swcombine-sdk-nodejs/classes/resources_DatacardResource.DatacardResource.html) | Datacards | Datacard management and assignment |

Also includes a [`Timestamp`](https://jonmarkgo.github.io/swcombine-sdk-nodejs/classes/Timestamp.Timestamp.html) utility for Combine Galactic Time (CGT) conversion and formatting.

For complete method signatures, parameters, and examples, see the **[API Reference Documentation](https://jonmarkgo.github.io/swcombine-sdk-nodejs/)**.

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
import { Message, MessageListItem } from 'swcombine-sdk';

// Types are automatically inferred
const character = await client.character.get({ uid: '1:12345' });
// character: Character

// Request parameters are typed
const listedMessages = await client.character.messages.list({
  uid: '1:12345',
  mode: 'received', // Optional - TypeScript knows valid values: 'sent' | 'received'
  // mode: 'invalid', // TypeScript error
});

const messageListItem: MessageListItem | undefined = listedMessages[0];
const messageId = messageListItem?.attributes.uid;

if (messageId) {
  const messageDetail: Message = await client.character.messages.get({
    uid: '1:12345',
    messageId,
  });
  console.log(messageDetail.communication);
}

// Send message: receivers must be handle(s), not UID(s)
await client.character.messages.create({
  uid: '1:12345',
  receivers: 'recipient_handle_1;recipient_handle_2',
  communication: 'Hello there',
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

- **[Basic Usage](examples/basic-usage.ts)** - Getting started with the SDK
- **[OAuth Flow](examples/oauth-flow.ts)** - Complete OAuth 2.0 authentication flow
- **[OAuth Scopes](examples/oauth-scopes-example.ts)** - Scope usage examples
- **[Error Handling](examples/error-handling.ts)** - Error handling patterns

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

- **[API Reference](https://jonmarkgo.github.io/swcombine-sdk-nodejs/)** - Full API reference with all methods, parameters, and examples
- **[Getting Started Guide](docs/GETTING_STARTED.md)** - Detailed setup and usage
- **[Authentication Guide](docs/AUTHENTICATION.md)** - OAuth 2.0 setup and token management
- **[OAuth Scopes Reference](docs/SCOPES.md)** - Complete scope documentation
- **[Getting an OAuth Token](docs/getting-oauth-token.md)** - Step-by-step token guide
- **[Local Development](docs/LOCAL_DEVELOPMENT.md)** - Development environment setup
- **[Publishing](docs/PUBLISHING.md)** - NPM publishing guide
- **[Examples](examples/)** - Working code examples

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run unit tests (fast, no API calls)
npm test

# Run unit tests in watch mode
npm run test:watch

# Run all integration tests (requires .env with API credentials)
npm run test:integration

# Run integration tests for a specific resource
npm run test:integration:character
npm run test:integration:galaxy
npm run test:integration:faction
# Also: test:integration:api, test:integration:market, test:integration:news,
#        test:integration:types, test:integration:misc

# Lint
npm run lint

# Format code
npm run format
```

## Requirements

- Node.js 18 or higher
- TypeScript 5.5 or higher (for TypeScript projects)

## Links

- [SDK API Reference](https://jonmarkgo.github.io/swcombine-sdk-nodejs/) - Full TypeDoc-generated documentation
- [SW Combine API Documentation](https://www.swcombine.com/ws/developers/) - Official API docs
- [npm Package](https://www.npmjs.com/package/swcombine-sdk)
- [GitHub Repository](https://github.com/jonmarkgo/swcombine-sdk-nodejs)

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
- Submit issues on [GitHub](https://github.com/jonmarkgo/swcombine-sdk-nodejs/issues)
- Contact support

---

<div align="center">
Made for the Star Wars Combine community
</div>
