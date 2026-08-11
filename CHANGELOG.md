# Changelog

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

### Notes

- Planets a character administers are only returned under
  `assignType: 'pilot'`; `'owner'` and `'commander'` return 0.
- Rate limits are enforced per endpoint pattern, not as one global budget.
