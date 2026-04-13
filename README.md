# SW Combine SDK for Node.js

<div align="center">

**Comprehensive TypeScript SDK for the Star Wars Combine API v2.0**

[![npm version](https://img.shields.io/npm/v/swcombine-sdk.svg)](https://www.npmjs.com/package/swcombine-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![API Docs](https://img.shields.io/badge/Docs-Mintlify-blue.svg)](https://swc-sdk.zeltros.dev/)

[Features](#features) •
[Installation](#installation) •
[Quick Start](#quick-start) •
[Documentation](#documentation) •
[Examples](#examples)

</div>

## Features

- **Full API Coverage** - All 60+ endpoints across 11 resource categories
- **`Page<T>` Pagination** - Every list endpoint returns `Page<T>` with `hasMore`, `getNextPage()`, and `for await...of` auto-pagination
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
import { SWCombine, AccessType } from 'swcombine-sdk';

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
  accessType: AccessType.Offline,
});
```

### 2. Make API Calls

```typescript
// Look up a character's UID from their handle (no auth required).
// Returns `{ uid, handle }`; use `character.get({ uid })` for the full profile.
const { uid, handle } = await publicClient.character.getByHandle({
  handle: 'character-handle',
});

console.log(uid);    // "1:12345"
console.log(handle); // "character-handle"
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

// Get character messages — list() returns Page<T>
import { MessageMode } from 'swcombine-sdk';

const messages = await authenticatedClient.character.messages.list({
  uid: '1:12345',
  mode: MessageMode.Received,
});

console.log(messages.total);           // total messages across all pages
console.log(messages.data.length);     // items on this page

const firstMessageId = messages.data[0]?.attributes.uid;
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

### 4. Pagination

All `list()` methods return a `Page<T>` with built-in pagination support. Single-item `get()` methods return the entity directly — no wrapper.

```typescript
// get() returns the entity directly — no .data needed
const character = await client.character.get({ uid: '1:12345' });
console.log(character.name);

// list() returns Page<T> — access items via .data
const ships = await client.inventory.entities.list({
  entityType: 'ships',
  uid: '1:12345',
  assignType: 'owner',
});

ships.data;     // Ship[] — items on this page
ships.total;    // total ships across all pages
ships.hasMore;  // boolean — are there more pages?

// Fetch the next page (preserves your filters)
if (ships.hasMore) {
  const nextPage = await ships.getNextPage();
}

// Auto-paginate through everything with for-await
for await (const ship of await client.inventory.entities.list({...})) {
  console.log(ship.name); // yields every ship across all pages
}
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
import { SWCombine, AccessType, CharacterScopes, MessageScopes } from 'swcombine-sdk';

const client = new SWCombine({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  redirectUri: 'http://localhost:3000/callback',
  accessType: AccessType.Offline, // Get refresh token
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
| [`client.api`](https://swc-sdk.zeltros.dev/resources/character) | Utilities | Hello world, permissions, rate limits, time conversion |
| [`client.character`](https://swc-sdk.zeltros.dev/resources/character) | Characters | Profile, messages, skills, privileges, credits, credit log |
| [`client.faction`](https://swc-sdk.zeltros.dev/resources/faction) | Factions | Info, members, budgets, stockholders, credits, credit log |
| [`client.galaxy`](https://swc-sdk.zeltros.dev/resources/galaxy) | Galaxy | Systems, sectors, planets, stations, cities |
| [`client.inventory`](https://swc-sdk.zeltros.dev/resources/inventory) | Inventory | Entity listing, management, tagging |
| [`client.market`](https://swc-sdk.zeltros.dev/resources/market) | Market | Vendor listings |
| [`client.news`](https://swc-sdk.zeltros.dev/resources/news) | News | GNS and Sim News feeds |
| [`client.types`](https://swc-sdk.zeltros.dev/resources/types) | Types | Entity types, classes, and detailed type info |
| [`client.events`](https://swc-sdk.zeltros.dev/resources/events) | Events | Personal, faction, inventory, and combat events |
| [`client.location`](https://swc-sdk.zeltros.dev/resources/location) | Location | Entity location lookups |
| [`client.datacard`](https://swc-sdk.zeltros.dev/resources/datacard) | Datacards | Datacard management and assignment |

Also includes a [`Timestamp`](https://swc-sdk.zeltros.dev/guides/timestamp-utility) utility for Combine Galactic Time (CGT) conversion and formatting.

For complete method signatures, parameters, and examples, see the **[Documentation](https://swc-sdk.zeltros.dev/)**.

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
import { Page, Message, MessageListItem, MessageMode } from 'swcombine-sdk';

// Types are automatically inferred
const character = await client.character.get({ uid: '1:12345' });
// character: Character

// list() returns Page<T> with full type safety
const messages: Page<MessageListItem> = await client.character.messages.list({
  uid: '1:12345',
  mode: MessageMode.Received, // MessageMode.Sent | MessageMode.Received
});

const messageId = messages.data[0]?.attributes.uid;

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
  accessType?: AccessType;    // AccessType.Online | AccessType.Offline

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

const client = new SWCombine({
  token: process.env.SWC_ACCESS_TOKEN!,
});

// Resolve a handle → UID, then fetch the full profile
const { uid, handle } = await client.character.getByHandle({ handle: 'character-name' });
const character = await client.character.get({ uid });

console.log(`${character.name} (${handle}, ${character.uid})`);
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

## Documentation

- **[Full Documentation](https://swc-sdk.zeltros.dev/)** - Guides, API reference, and examples
- **[Quickstart](https://swc-sdk.zeltros.dev/quickstart)** - Install the SDK and make your first API call
- **[Authentication Guide](https://swc-sdk.zeltros.dev/authentication/overview)** - OAuth 2.0 setup and token management
- **[v2 → v3 Migration Guide](https://swc-sdk.zeltros.dev/guides/migration-v3)** - Breaking changes and upgrade instructions
- **[Local Development](docs/LOCAL_DEVELOPMENT.md)** - Development environment setup
- **[Publishing](docs/PUBLISHING.md)** - NPM publishing guide

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

# Lint
npm run lint

# Format code
npm run format
```

> **Note:** An integration test suite exists under `tests/integration/` but runs against the
> live SW Combine API and shares the global 600 req/hour rate limit. It is **not** intended
> for routine developer use — please don't run it as part of normal workflows. Maintainers
> should consult `tests/integration/README.md` before running it against production.

## Requirements

- Node.js 18 or higher
- TypeScript 5.5 or higher (for TypeScript projects)

## Links

- [SDK Documentation](https://swc-sdk.zeltros.dev/) - Full documentation, guides, and API reference
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
