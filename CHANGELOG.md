# Changelog

## 3.6.0

**Upgrading:** runtime behaviour is unchanged apart from the two fixes below, but several
return types were corrected to match what the API actually sends. Code that read fields
the API never returned (for example `event.uid` on a list row, `vendor.uid`,
`credits.amount`, `entityType.name`) will now fail to compile; those reads were always
`undefined` at runtime.

### Added

- **Shield arcs and station armour on type endpoints.** `TypesShipEntity` gains
  `shieldArcs` (typed as `TypesShipShieldArc[]`), `shieldArcTemplate` and `garrisons`.
  Small ships omit both arc fields. `TypesStationEntity` gains `armour`. Inventory
  entity endpoints are unchanged.
- `armour` on `TypesVehicleEntity` and `TypesFacilityEntity`; `garrisons` on
  `TypesFacilityEntity`; `timeFactor` on ship `production`.

### Fixed

Audited against the example responses now published in the API docs, and verified live.

- **`faction.stockholders.list()` always returned no rows.** Holders are read from
  `characters.character` and `factions.faction`.
- **`events.list()` never auto-paginated.** The events endpoint reports no `total`, so
  `hasMore` was always false. It is now true when a full page comes back; `page.total`
  stays 0 for events.
- **Return types that did not match the API** (runtime behaviour unchanged):
  - `faction.credits.get()` returns a `number` (was typed `{ amount }`).
  - `faction.members.updateMemberInfo()` returns the updated member UID as a `string`.
  - `character.get()` returns `CharacterMe`; the old `Character` type declared a `handle`
    the API never sends.
  - `CharacterMe` gains `XP` / `XPLevel` (the API's casing; `xp` / `xpLevel` are deprecated
    and were never populated), typed force details, and `"Freelance"` string forms of
    `faction` / `factions`.
  - `character.messages.create()` returns `MessageCreateResult`; credit transfers return
    `CreditTransferResult`.
  - `events.list()` rows are `{ attributes, time, text }`; `events.get()` returns
    `EventDetail`.
  - `market.vendors.list()` rows are keyed by `attributes.id`; `get()` returns
    `VendorDetail` with `shopkeeper` and `wares`.
  - `location.get()` returns `EntityLocation`.
  - Datacard `list()` / `get()` / `create()` / `delete()` return `DatacardListItem`,
    `Datacard` (with `entity`, `owner`, `assignedlocations`), `DatacardAssignResult` and
    `DatacardRevokeResult`.
  - `inventory.get()` returns `InventorySummary`; `updateProperty()` and the tag methods
    return `InventoryPropertyResult` / `InventoryTagResult`.
  - `types.listEntityTypes()` entries are `{ attributes: { id, name, href? } }`.
  - Faction member, budget and stockholder rows match the API; `budgets.list()` rows are
    `BudgetListItem`. `FactionDetail` gains `status`.

## 3.5.0

### Added

- **PKCE support** for the OAuth authorization code flow (RFC 7636, S256). New
  `createPkcePair()` helper; pass `codeChallenge` to `auth.getAuthorizationUrl()` and the
  matching verifier as the new optional second argument to `auth.handleCallback()`.
  Optional and backwards compatible. Verified against the live API.
- **PvP fields on galaxy endpoints.** Planets and systems (list and detail) now include a
  `combat` block, typed as `GalaxyCombat`: `groundpvp`, `groundpve`, `showdown`,
  `pvpsafezone`, plus `spacepvp` and `spacepve` on systems only. Sectors, stations and
  cities do not return it.

### Changed

- `npm run get-token` now uses PKCE and honours a `PORT` environment variable.

## 3.4.1

### Added

- `HyperspaceTravelAction` added to `KnownActionType`, bringing the observed set to
  nine. It was found the day after 3.4.0 shipped. Because `EntityActionType` is an
  open union, 3.4.0 consumers could already read this action type — this only adds
  autocomplete for it.
- Documented that **a ship in hyperspace has no coordinates.** While a
  `HyperspaceTravelAction` is running, every entry in `EntityCoordinates` is returned
  as an empty object, as are `sector`, `system`, `planet` and `city` on
  `EntityLocation`; only `container` stays populated. Code reading
  `location.coordinates.galaxy.attributes.x` without optional chaining will throw when
  a ship jumps to hyperspace.

### Changed

- Planning documents under `docs/superpowers/` are no longer tracked in the repository.

## 3.4.0

### Added

- `inventory.entities.get()` is now generic over `entityType` and returns a
  per-type detail interface (`ShipEntityDetail`, `NpcEntityDetail`,
  `FacilityEntityDetail`, and eight more) via `InventoryEntityDetailMap`.
- Types for the reworked `actions` block: `EntityActions`, `EntityAction`,
  `EntityActionValue`, `EntityActionDelay`. `actions.action` is always an array,
  even for a single action.
- `KnownActionType` covering the eight action types observed so far, and
  `EntityActionType`, an open union that accepts unrecognised action types
  rather than failing to compile.
- Type guards `isMiningAction`, `isEntityProductionAction`, `isRetoolingAction`.
- Types for previously unmodelled fields: NPC `race`/`gender`/`level`/`skills`,
  planet `planetaryStats`/`deposits`, facility `facilityincome`/`energyremaining`/
  `poweredby`, station and facility `queueitems`/`tooledto`.
- `npm run typecheck`, which type-checks tests as well as `src`.
- `inventory.entities.get()` now normalizes skill values. The API returns non-zero
  skill values inconsistently as either a number or a quoted string (the same value
  appears as both `1` and `"1"`, in every skill group); the SDK coerces them so
  `EntitySkill.value` is reliably a `number`. This is the only place the SDK rewrites
  an API response.

### Fixed

These correct type declarations that never matched what the API returns. The
runtime data is unchanged, but code reading these fields may need updating.

- `Entity.type` was declared `string`; the API returns a reference object. The
  string form lives in `Entity.entitytype`.
- `Entity.owner` was declared `Character | Faction | string`; the API returns an
  `EntityReference`.
- `EntityImages.customsmall` and `.customlarge` are now optional. Facilities,
  materials, NPCs and creatures return only `small` and `large`.
- `inventory.entities.get()`'s `entityType` option no longer accepts an arbitrary
  `string` — it is now generic and must be one of the 11 literal `InventoryEntityType`
  values (`'ships'`, `'npcs'`, etc.), matching what `list()` already required. Callers
  holding the entity type in a `string`-typed variable will need to narrow it, e.g.
  `entityType: entityType as InventoryEntityType`.

### Notes

- Planets a character administers are only returned under
  `assignType: 'pilot'`; `'owner'` and `'commander'` return 0.
- Rate limits are enforced per endpoint pattern, not as one global budget.
