# Migrating from v2 to v3

This guide covers all breaking changes in the v3.0 release and how to update your code.

## Overview

v3.0 introduces two breaking changes:

1. **Unified pagination** — All `list()` methods now return `Page<T>` instead of raw arrays or bespoke wrapper types
2. **Authorization header** — Access tokens are now sent via `Authorization: OAuth {token}` header instead of the `?access_token=...` query parameter

## Pagination: `Page<T>`

### What changed

Every `list()` method that previously returned `T[]`, `FactionListResponse`, `NewsListResponse`, or any other shape now returns `Page<T>`.

`Page<T>` has the following interface:

```typescript
class Page<T> {
  readonly data: T[];       // The items on this page
  readonly total: number;   // Total items across all pages
  readonly start: number;   // Starting index of this page
  readonly count: number;   // Number of items on this page
  readonly hasMore: boolean; // Whether more pages exist

  getNextPage(): Promise<Page<T>>;  // Fetch the next page
  [Symbol.asyncIterator](): AsyncIterator<T>; // Auto-paginate with for-await
}
```

### Quick reference

| v2 pattern | v3 equivalent |
|-----------|---------------|
| `result[0]` | `result.data[0]` |
| `result.forEach(...)` | `result.data.forEach(...)` |
| `result.length` | `result.data.length` |
| `result.map(...)` | `result.data.map(...)` |
| `result.faction?.[0]` | `result.data[0]` |
| `result.attributes?.total` | `result.total` |
| `result.attributes?.start` | `result.start` |
| `result.attributes?.count` | `result.count` |
| `listRaw()` | `list()` (now includes metadata) |
| `listAll()` | `for await (const item of await list()) { ... }` |

### Updating array-based endpoints

Most endpoints (inventory, galaxy, events, market, datacards, character messages/creditlog, faction members/budgets/stockholders/creditlog) previously returned plain arrays.

```typescript
// v2
const ships = await client.inventory.entities.list({
  entityType: 'ships',
  uid: '1:12345',
  assignType: 'owner',
});
ships.forEach(s => console.log(s.name));
console.log(`Got ${ships.length} ships`);

// v3
const ships = await client.inventory.entities.list({
  entityType: 'ships',
  uid: '1:12345',
  assignType: 'owner',
});
ships.data.forEach(s => console.log(s.name));
console.log(`Got ${ships.data.length} of ${ships.total} ships`);
```

### Updating faction list

```typescript
// v2
const result = await client.faction.list();
result.faction?.forEach(f => console.log(f.value));
console.log(result.attributes?.total);

// v3
const result = await client.faction.list();
result.data.forEach(f => console.log(f.value));
console.log(result.total);
```

### Updating news list

```typescript
// v2
const news = await client.news.gns.list();
news.forEach(n => console.log(n.value));
console.log(news.attributes.total);

// v3
const news = await client.news.gns.list();
news.data.forEach(n => console.log(n.value));
console.log(news.total);
```

### Replacing `listRaw()`

Galaxy and Types resources previously had a `listRaw()` method to access pagination metadata. This is no longer needed — `list()` now includes everything.

```typescript
// v2
const raw = await client.galaxy.planets.listRaw();
console.log(raw.attributes?.total);
const planets = raw.planet || [];

// v3
const planets = await client.galaxy.planets.list();
console.log(planets.total);
// planets.data is the array
```

### Replacing `listAll()`

`FactionResource.listAll()` has been removed. Use `for await...of` to auto-paginate:

```typescript
// v2
const allFactions = await client.faction.listAll();
console.log(allFactions.length);

// v3
const allFactions = [];
for await (const faction of await client.faction.list()) {
  allFactions.push(faction);
}
console.log(allFactions.length);
```

This pattern works on every `list()` endpoint, not just factions.

### New capabilities

These features are new in v3 and available on every `list()` endpoint:

```typescript
// Check if there are more pages
const page = await client.inventory.entities.list({ ... });
console.log(page.hasMore); // true/false

// Manually fetch the next page (preserves your original filters)
if (page.hasMore) {
  const nextPage = await page.getNextPage();
}

// Auto-paginate through all results
for await (const ship of await client.inventory.entities.list({ ... })) {
  console.log(ship.name); // yields every ship across all pages
}

// JSON serialization works cleanly
console.log(JSON.stringify(page));
// { "data": [...], "total": 100, "start": 1, "count": 50, "hasMore": true }
```

### Unchanged endpoints

These methods were **not** paginated lists and are unchanged:

- `character.skills.list()` — still returns `CharacterSkills`
- `character.privileges.list()` — still returns `PrivilegesResponse`
- `character.permissions.list()` — still returns `CharacterPermissionsResponse`
- All `.get()` methods — still return the entity directly

## Removed types

If you import any of these types, replace them with `Page<T>`:

| Removed type | Replacement |
|-------------|-------------|
| `FactionListResponse` | `Page<FactionListItem>` |
| `FactionListAttributes` | Use `page.total`, `page.start`, `page.count` |
| `NewsListResponse` | `Page<NewsListItem>` |
| `NewsListAttributes` | Use `page.total`, `page.start`, `page.count` |
| `GalaxyListAttributes` | Use `page.total`, `page.start`, `page.count` |
| `GalaxyPlanetListRawResponse` | `Page<GalaxyPlanetListItem>` |
| `GalaxySectorListRawResponse` | `Page<GalaxySectorListItem>` |
| `GalaxySystemListRawResponse` | `Page<GalaxySystemListItem>` |
| `GalaxyStationListRawResponse` | `Page<GalaxyStationListItem>` |
| `GalaxyCityListRawResponse` | `Page<GalaxyCityListItem>` |
| `TypesEntitiesListRawResponse` | `Page<TypesEntityListItem>` |
| `TypesShipsListRawResponse` | `Page<TypesEntityListItem>` |
| `TypesEntitiesListMetaResponse` | `Page<TypesEntityListItem>` |
| `TypesEntityListAttributes` | Use `page.total`, `page.start`, `page.count` |
| `ListResponse<T>` | `Page<T>` |

Import `Page` from the SDK:

```typescript
import { Page } from 'swcombine-sdk';
```

## Authorization header

Access tokens are now sent via the `Authorization: OAuth {token}` HTTP header instead of the `?access_token=...` query parameter.

**No code changes are needed on your end.** The SDK handles this automatically. Both methods are supported by the SWC API, but the header approach keeps tokens out of server logs, proxy logs, and HTTP Referer headers.

If you have any infrastructure that inspects outgoing request URLs for the `access_token` parameter (logging, proxies, etc.), be aware it will no longer appear there.

## TypeScript compiler will help

The `Page<T>` change is fully caught by TypeScript. After upgrading, run `tsc` and the compiler will flag every call site where the return type changed. The fix is almost always adding `.data` to access the array.
