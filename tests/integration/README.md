# Integration Tests

These integration tests validate the SDK against the live SW Combine API and capture real API responses to refine type definitions.

## Setup

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your credentials in `.env`:**
   ```bash
   # Required for all tests
   SWC_CLIENT_ID=your_client_id
   SWC_CLIENT_SECRET=your_client_secret

   # Optional: For authenticated endpoints
   SWC_ACCESS_TOKEN=your_access_token

   # Optional: Test data (replace with real UIDs)
   TEST_CHARACTER_UID=12345
   TEST_CHARACTER_HANDLE=YourHandle
   TEST_FACTION_UID=67890
   TEST_PLANET_UID=1
   TEST_SECTOR_UID=1
   TEST_SYSTEM_UID=1
   ```

3. **Get your OAuth credentials:**
   - Visit the SW Combine API developer portal
   - Create an OAuth application
   - Copy your Client ID and Client Secret

4. **Get an access token (for authenticated tests):**
   - Use the OAuth flow to authorize your app
   - Obtain an access token with appropriate scopes
   - Add it to `.env` as `SWC_ACCESS_TOKEN`

## Running Tests

### Run all integration tests:
```bash
npm run test:integration
```

### Run specific test file:
```bash
npm run test:integration tests/integration/api.test.ts
npm run test:integration tests/integration/character.test.ts
npm run test:integration tests/integration/faction.test.ts
npm run test:integration tests/integration/galaxy.test.ts
npm run test:integration tests/integration/market.test.ts
npm run test:integration tests/integration/news.test.ts
npm run test:integration tests/integration/types.test.ts
npm run test:integration tests/integration/misc.test.ts
```

## Test Coverage

### API Resource Tests (`api.test.ts`)
- ✅ HelloWorld - Public endpoint
- ✅ HelloAuth - Requires authentication
- ✅ Permissions - Lists all available OAuth scopes
- ✅ RateLimits - Current rate limit status
- ✅ Time - Server time information

### Character Resource Tests (`character.test.ts`)
- ✅ Get character by handle (public)
- ✅ Get character by UID
- ✅ List character skills
- ✅ List character privileges
- ✅ Get character credits
- ✅ List character messages
- ✅ Get character permissions

### Faction Resource Tests (`faction.test.ts`)
- ✅ List all factions (public)
- ✅ Get specific faction
- ✅ List faction members
- ✅ List faction budgets
- ✅ List faction stockholders

### Galaxy Resource Tests (`galaxy.test.ts`)
- ✅ List/Get planets (public)
- ✅ List/Get sectors (public)
- ✅ List/Get systems (public)
- ✅ List stations (public)
- ✅ List cities (public)

### Market Resource Tests (`market.test.ts`)
- ✅ List public vendors
- ✅ Get specific vendor

### News Resource Tests (`news.test.ts`)
- ✅ List GNS (Galactic News Service) items
- ✅ Get specific GNS item
- ✅ List Sim News items
- ✅ Get specific Sim News item

### Types Resource Tests (`types.test.ts`)
- ✅ List all entity types
- ✅ List classes for entity type
- ✅ List entities by type
- ✅ List entities by type and class

### Misc Resource Tests (`misc.test.ts`)
- ✅ Events - List and get events
- ✅ Location - Get entity location
- ✅ Datacard - List faction datacards
- ✅ Inventory - Get inventory and list entities

## API Response Capture

All API responses are automatically saved to:
```
tests/integration/api-responses/
```

These JSON files contain real API responses and are used to:
1. Document actual API response formats
2. Refine TypeScript type definitions
3. Validate SDK behavior against real data

## Rate Limiting

Tests include automatic delays between requests to respect the API's rate limit (600 requests/hour).

Each test waits 100ms between requests, but you can adjust this in individual test files.

## Handling Errors

Tests are designed to:
- Continue running even if some endpoints fail
- Capture error responses for debugging
- Skip tests that require unavailable data

Error responses are also saved to `api-responses/` with `-error` suffix.

## Tips

1. **Start with public endpoints** - Run API, Galaxy, Market, News, Types tests first (no auth required)

2. **Get an access token** - For full test coverage, you'll need an OAuth access token

3. **Use real test data** - Replace placeholder UIDs in `.env` with real values from your account

4. **Check rate limits** - Monitor your rate limit status with `client.api.rateLimits()`

5. **Review responses** - Check `api-responses/*.json` files to understand actual API response structure

## Expected Test Results

- **Without access token:** ~40% of tests will run (public endpoints)
- **With access token:** ~90% of tests will run (most endpoints)
- **With full test data:** 100% of tests will run

Tests that can't run will be skipped with console messages explaining why.
