# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive TypeScript SDK for the Star Wars Combine API v2.0. It provides full OAuth 2.0 authentication, type-safe API resource access, automatic token refresh, and retry logic for all 60+ API endpoints.

**Tech Stack:**
- TypeScript 5.5+ (strict mode)
- Dual module system: ES Modules (primary) + CommonJS (compatibility)
- Vitest for testing
- Axios for HTTP
- Node.js 18+

## Build System

This project uses a **triple-build system** to generate three separate outputs:

```bash
npm run build              # Build all three outputs
npm run build:cjs          # CommonJS → dist/cjs/
npm run build:esm          # ES Modules → dist/esm/
npm run build:types        # Type definitions → dist/types/
npm run build:watch        # Watch mode for development
```

Each build uses a separate `tsconfig.*.json` file with different module settings. All three must succeed for a valid build.

## Testing

```bash
npm test                   # Run unit tests (vitest watch mode)
npm run test:watch         # Explicit watch mode
npm run test:integration   # Run integration tests (requires .env with valid credentials)
```

**Integration tests** require a `.env` file with:
- `SWC_CLIENT_ID` - OAuth client ID
- `SWC_CLIENT_SECRET` - OAuth client secret
- `SWC_ACCESS_TOKEN` - Valid access token
- `TEST_CHARACTER_UID` - Character UID (format: "1:12345")
- `TEST_FACTION_UID` - Faction UID (optional)

Integration tests make real API calls and document responses in `tests/integration/api-responses/`.

## Code Quality

```bash
npm run lint               # Run ESLint
npm run lint -- --fix      # Auto-fix lint issues
npm run format             # Format with Prettier
npm run format:check       # Check formatting without changing
```

**Lint warnings policy:** The codebase has ~17 remaining `any` type warnings in error handling and HTTP internals, which are acceptable. All errors must be fixed.

## Developer Tools

```bash
npm run get-token          # Interactive OAuth flow to get access token
npm run get-character-uid  # Get character UID from handle
npm run refresh-token      # Refresh an existing token
```

These scripts use `tsx` to run TypeScript directly and are located in `scripts/`.

## Architecture

### Client Initialization Flow

1. `SWCombine` class (src/SWCombine.ts) - Main entry point
2. Creates `TokenManager` - Manages access/refresh tokens
3. Creates `OAuthClient` - Handles OAuth flows
4. Creates `HttpClient` - Wraps Axios with retry logic and token injection
5. Instantiates all resource classes with the `HttpClient`

### Resource Pattern

All API resources extend `BaseResource` (src/resources/BaseResource.ts) which provides:
- `protected request<T>(method, path, data?)` - Generic HTTP request method
- `protected http: HttpClient` - Direct access to HTTP client

**Resource organization:**
- `ApiResource` - Meta endpoints (helloworld, permissions, ratelimits)
- `CharacterResource` - Character endpoints with nested sub-resources:
  - `character.messages` - Message management
  - `character.skills` - Skills data
  - `character.privileges` - Privileges
  - `character.credits` - Credits information
  - `character.creditlog` - Credit transaction history
  - `character.permissions` - OAuth permissions
- `FactionResource` - Faction data with nested:
  - `faction.members`
  - `faction.budgets`
  - `faction.stockholders`
  - `faction.creditlog`
- `GalaxyResource` - Galaxy data with nested:
  - `galaxy.planets`
  - `galaxy.sectors`
  - `galaxy.systems`
  - `galaxy.stations`
  - `galaxy.cities`
- `InventoryResource`, `MarketResource`, `NewsResource`, etc.

### HTTP Request Flow

1. Resource method called → `BaseResource.request()` or direct `http.get/post()`
2. `HttpClient` adds query params (pagination, filtering)
3. **Request interceptor** injects `access_token` as query param (not header - API requirement)
4. **Response interceptor** handles errors, converts to `SWCError`, manages retries
5. Automatic token refresh on 401 if refresh token available

### Pagination Pattern

All list endpoints support optional pagination parameters:

```typescript
{
  start_index?: number;  // Default: 1 (0 for Events endpoint - special case!)
  item_count?: number;   // Default: 50
}
```

**Critical:** Events endpoint uses **0-based indexing** while all others use **1-based indexing**.

Query parameters use `QueryParams` type from src/types/index.ts which supports primitives and arrays.

### Error Handling

All API errors are converted to `SWCError` (src/http/errors.ts) with:
- `statusCode` - HTTP status
- `type` - Error category (not_found, unauthorized, etc.)
- `retryable` - Whether retry makes sense
- `response` - Raw API response

Automatic retry with exponential backoff for retryable errors (network, 5xx, rate limits).

### Token Management

`TokenManager` (src/auth/TokenManager.ts) handles:
- Token storage (in-memory or custom via `TokenStorage` interface)
- Expiration checking with 5-minute buffer
- Automatic refresh when expired
- Thread-safe refresh (prevents concurrent refresh requests)

Tokens can be:
- String (access token only)
- `OAuthToken` object (access + refresh + expiry)

### OAuth Scopes

Type-safe scope constants in src/auth/scopes.ts:
- `CharacterScopes.*` - Character permissions
- `MessageScopes.*` - Message operations
- `Scopes.PersonalInventory.SHIPS.READ` - Nested inventory scopes
- `FactionScopes.*`, etc.

Helper functions: `getAllScopes()`, `getReadOnlyScopes()`, `getMinimalScopes()`

## Type System

### Common Patterns

- `[key: string]: unknown` for flexible API response objects (not `any`)
- `QueryParams` type for all query parameter objects
- Resource constructors take `HttpClient` (not `any`)
- `BaseResource.request()` uses `unknown` for data parameter

### API Response Handling

The SW Combine API returns inconsistent formats:
- Sometimes arrays: `[{...}, {...}]`
- Sometimes wrapped: `{ sector: [{...}], attributes: {...} }`

Resources normalize these in their methods. Check `GalaxyResource.ts` for casting examples.

## File Structure

```
src/
├── index.ts                 # Public API exports
├── SWCombine.ts            # Main client class
├── auth/                   # OAuth & token management
│   ├── OAuthClient.ts      # OAuth 2.0 flows
│   ├── TokenManager.ts     # Token storage & refresh
│   ├── scopes.ts           # Type-safe scope constants
│   └── permissions.ts      # Permission definitions
├── http/                   # HTTP layer
│   ├── HttpClient.ts       # Axios wrapper with retry logic
│   └── errors.ts           # SWCError class
├── resources/              # API resource classes
│   ├── BaseResource.ts     # Base class for all resources
│   ├── ApiResource.ts
│   ├── CharacterResource.ts
│   ├── FactionResource.ts
│   ├── GalaxyResource.ts
│   ├── InventoryResource.ts
│   ├── MarketResource.ts
│   ├── NewsResource.ts
│   ├── TypesResource.ts
│   ├── EventsResource.ts
│   ├── LocationResource.ts
│   └── DatacardResource.ts
└── types/
    └── index.ts            # All TypeScript interfaces & types

tests/
├── unit/                   # Unit tests (none yet)
└── integration/            # Real API integration tests
    ├── setup.ts            # Test configuration & helpers
    ├── api.test.ts
    ├── character.test.ts
    ├── faction.test.ts
    ├── galaxy.test.ts
    └── ...

scripts/                    # Developer utilities
├── get-oauth-token.ts      # Interactive OAuth flow
├── get-character-uid.ts    # UID lookup
└── refresh-token.ts        # Token refresh
```

## Publishing

```bash
npm run prepublishOnly     # Runs automatically before publish (build + test)
npm publish --access public
```

See `docs/PUBLISHING.md` for complete publishing guide including versioning, npm setup, and troubleshooting.

The package exports both ESM and CJS via the `exports` field in package.json. Only `dist/`, `README.md`, and `LICENSE` are included in the npm package (see `files` field).

## Important Constraints

### API Quirks

1. **Token as query param**: Access tokens MUST be sent as `?access_token=...` query parameter, not Authorization header
2. **0-based Events indexing**: Events endpoint uses `start_index: 0` while all others use `start_index: 1`
3. **Inconsistent responses**: Some endpoints return arrays, others return wrapped objects with metadata
4. **Required pagination**: Some endpoints (sectors, types/classes) return 404 without pagination params

### Dependencies

- **Only production dependency:** `axios` (HTTP client)
- All other dependencies are dev-only
- Keep it minimal - this is a client library

### TypeScript Strictness

The project uses strict TypeScript (`strict: true`):
- No implicit any
- Strict null checks
- Strict function types
- All resource constructors must type their http parameter

When adding new endpoints, always:
1. Add pagination parameters where applicable
2. Use `QueryParams` type for query objects
3. Document any special indexing or parameter requirements
4. Add integration test if credentials available

## Common Tasks

**Adding a new endpoint:**
1. Update the appropriate resource class (e.g., `CharacterResource.ts`)
2. Add TypeScript interfaces to `src/types/index.ts` if needed
3. Follow existing pagination patterns
4. Add integration test to `tests/integration/`
5. Build and run tests

**Fixing test timeouts:**
- Integration tests can be slow (API response times vary)
- Default timeout: 5000ms
- Increase per-test: `it('test name', async () => { ... }, 15000)`
- Some endpoints (location, types/classes) are notably slower

**Debugging API calls:**
- Set `debug: true` in client config to log all requests/responses
- Check `tests/integration/api-responses/` for captured API response structures
