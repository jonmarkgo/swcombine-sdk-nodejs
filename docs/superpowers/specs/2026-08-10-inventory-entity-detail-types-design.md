# Inventory Entity Detail Types — Design

**Date:** 2026-08-10
**Status:** Draft, pending review
**Trigger:** Clarr's announcement that `GET ws/v2.0/inventory/{entity_type}/{uid}` changed how actions are output, plus observed NPC fields the SDK never modelled.

## Problem

`client.inventory.entities.get()` returns `Entity`:

```ts
export interface Entity {
  uid: string;
  type: string;          // WRONG — see below
  name?: string;
  owner?: Character | Faction | string;
  [key: string]: unknown;
}
```

Three defects:

1. **`type` is mistyped.** Every captured payload returns `type` as an object
   (`{ attributes: { uid, href }, value: string }`) and puts the type *string* in
   `entitytype`. `Entity.type` is declared as a required `string`, so callers reading
   `entity.type` get an object at runtime while TypeScript promises a string.
2. **Actions are entirely unmodelled**, including the changes Clarr announced.
3. **Everything else falls through the index signature** — NPC `race`/`gender`/`level`,
   planet `planetaryStats`/`deposits`, facility `deposits`/`energyremaining` are invisible
   to autocomplete and unchecked by the compiler.

The list endpoints are already well typed via `InventoryEntityTypeMap`. The detail endpoint
never received the same treatment. This design closes that gap.

## Evidence

All shapes below were captured live on 2026-08-10 from character `1:46931` and faction
`20:502`, 150 API calls total. Raw payloads are in the capture set (see Testing).

Coverage: all 11 entity types, 100+ detail payloads (61 facilities alone), including 10
targeted known-busy entities covering six distinct action types.

### The actions envelope

From facility `4:222895`:

```json
"actions": { "action": [ {
  "attributes": { "type": "MiningAction", "id": 184163909 },
  "value": {
    "actiontype": "Mining",
    "status": "paused",
    "delay": { "total": 604800, "remaining": 604800 },
    "repeating": "yes",
    "expected-yield": 2112, "expected-cost": 615332,
    "workers": 12, "droids": 1
  } } ] }
```

Three known-busy entities were then fetched directly (facility `4:3497164` mining,
station `5:13116` producing, faction station `5:718` retooling), which confirmed every
remaining claim:

**Multi-action, with optional timers** — station `5:718` returns two actions, the first
of which has *no* `status` and *no* `delay`:

```json
"actions": { "action": [
  { "attributes": { "type": "EntityProductionAction", "id": 239614058 },
    "value": { "actiontype": "Entity Production", "quantity": 1, "workers": 0,
               "producing": { "entity": [] } } },
  { "attributes": { "type": "RetoolingAction", "id": 239614059 },
    "value": { "actiontype": "Retooling", "status": "running",
               "delay": { "total": 363600, "remaining": 34909 },
               "type": { "attributes": { "uid": "2:316", "href": "..." },
                         "value": "Behemoth-class Star Dreadnaught" } } }
] }
```

**Entity production** — station `5:13116` carries `producing.entity[]`, refs to the
entity under construction (the array is empty when the slot is idle):

```json
"producing": { "entity": [ { "value": "[No Name]",
  "attributes": { "uid": "2:7119317", "type": "ship", "href": "..." } } ] }
```

Observed action types so far (8): `MiningAction`, `EntityProductionAction`,
`RetoolingAction`, `SublightTravelAction`, `AsteroidMiningSoloAction`, `CargoDelayAction`,
`FacilityConstructionAction`, `AsteroidProspectingAction`.

**The action type set is open, and we have proof.** Targeted fetches kept yielding new
types right up to the last one: the 6th fetch produced `AsteroidMiningSoloAction`, the
8th `CargoDelayAction`, the 13th `FacilityConstructionAction`, the 15th
`AsteroidProspectingAction`. **Eight types from fifteen targeted fetches, still finding
new ones on the last attempt** — the set is nowhere near enumerated, and `AsteroidMiningSoloAction` implies non-solo variants we still have not
seen. Any closed union over `attributes.type` would be wrong on arrival — see the
`EntityActionType` open union in the design below.

**Many action types are timer-only.** `SublightTravelAction`, `AsteroidMiningSoloAction`
and `CargoDelayAction` carry nothing beyond `actiontype`, `status` and `delay`.
`FacilityConstructionAction` adds only `workers`. The base shape is therefore the common
case, not the fallback.

**`producing.entity[]` length tracks `quantity`.** Facility `4:5648314` runs a single
`EntityProductionAction` with `quantity: 12` and twelve ship refs in `producing.entity`.
Earlier samples showed one and zero, so this is a genuine variable-length array. Note
also that `EntityProductionAction` appears on **facilities as well as stations**, and
that `tooledto` (a ref to the type being built) accompanies it on both.

**Asteroid mining reports no resource or yield.** Ships `2:6516362` and `2:6516607` mine
*different* resources for the same station, yet their payloads are byte-identical apart
from `uid`, action `id`, timer values, coordinates and cargo fill. `AsteroidMiningSoloAction`
carries only `actiontype`/`status`/`delay`, while the facility-side `MiningAction` reports
`expected-yield`, `expected-cost`, `workers` and `droids`. There is no supported way to
learn what a mining ship is extracting.

Correlating a ship's `location.coordinates.system.{x,y}` against the station's
`deposits[].attributes.{x,y}` identifies the resource only when the ship is parked on its
square — it matched for 1 of 3 mining ships tested. It is a heuristic, not a reliable
inference, and the SDK should not ship a helper that implies otherwise.

**Actions attach to the entity doing the work, not the one benefiting.** Station
`5:61544` is an asteroid mining station, but returns *no* `actions` — only `deposits`.
The `AsteroidMiningSoloAction` lives on ship `2:6516289`, which mines for it. Consumers
looking for "what is this station doing" cannot rely on the station's own `actions`.

**Naming collision to be careful about:** `attributes.type` is a *string* class name
(`"RetoolingAction"`), while a Retooling action's `value.type` is an *object ref* to the
type being retooled to. Same key name, different level, different shape.

This confirms Clarr's list and adds three details he did not mention:

- Actions use the **same wrapper idiom as the rest of the API** —
  `{ actions: { action: [...] } }`, matching `tags.tag`, `crewlist.entry`,
  `deposits.deposit`, `buildings.building`, `poweredby.pg`.
- `attributes` carries both `type` (`"MiningAction"`) and a numeric `id`.
- The `value` payload is **action-specific**: `expected-yield`, `expected-cost`,
  `workers`, `droids`, `repeating` are Mining-only fields. Other action types will
  carry different keys.

`actiontype` (`"Mining"`) is the display string; `attributes.type` (`"MiningAction"`) is
the discriminator.

### API quirk: administered planets sit under `pilot`

| assign type | character `1:46931` | faction `20:502` |
| --- | --- | --- |
| `owner` | 0 | 107 |
| `commander` | 0 | 0 |
| `pilot` | **5** | — |

The 5 administered planets are only reachable via `assignType: 'pilot'`. This is
undocumented and needs a JSDoc note on `list()`.

### Notable per-type fields

- **npcs** — `race` (ref), `gender` (`{attributes:{gender:'M'}, value:'Male'}`), `level`
  (number), `hp`, `skills`, `controller`. `type` is sometimes `{}` rather than a ref.
- **planets** — `planetaryStats` (`crime`, `morale`, `taxLevel`, `er`, `population`,
  `hireable`, `civLevel` — all numbers), `deposits`.
- **facilities** (61 samples, so the optionality rates below are meaningful) —
  `facilityincome` 37/61, `ispowered` 46/61, `poweredby` 45/61, `energyremaining` 15/61,
  `powergenconnectedto` 8/61, `deposits` 2/61, `actions` 2/61. `crewlist`, `orientation`
  and `underconstruction` are always present.

  **`facilityincome` is the "FI data" Clarr referred to** — FI being facility income /
  tax income:

  ```json
  "facilityincome": { "currentdebt": 0, "income": 10013, "paiddebt": 0, "warnings": 0 }
  ```

  **Facility power is a three-state pattern**, verified across all 65 facility samples
  and mutually exclusive:

  | Count | `ispowered` | `poweredby` | `energyremaining` | Meaning |
  | --- | --- | --- | --- | --- |
  | 48 | `"Yes"` | present | absent | consumer, externally powered |
  | 15 | *absent* | absent | present | the facility **is** a power generator |
  | 2 | `"No"` | absent | absent | unpowered |

  So `energyremaining` identifies generators, while `ispowered`/`poweredby` describe
  consumers. All three fields must be optional, and `poweredby` is absent rather than
  empty when a facility is unpowered.

  Two shape hazards: `income` and `paiddebt` are **absent** on some facilities
  (`{ currentdebt, warnings }` only), and `warnings` is a **number in list payloads but
  an object (`{}`) in detail payloads**. It must be typed `number | Record<string, unknown>`.
- **creatures** — `hp`, `skills`, no hull/shield.
- **ships** — `datablockstotal` / `datablocksused`, `crewlist`.
- **materials** — `quantity`, no `creationdate`.

`race` is `{attributes: {uid, href}, value}` — it has **no `type` key**, so the existing
`EntityReference` (which requires `attributes.type`) does not fit. A looser
`EntityRef` is needed.

## Design

### 1. Shared building blocks

```ts
interface EntityRef { attributes: { uid: string; href: string }; value: string }
interface EntityGender { attributes: { gender: string }; value: string }
interface EntityCreationDate {
  years: number; days: number; hours: number; mins: number; secs: number; timestamp: number;
}
/**
 * Capacity only — the route never reports cargo *contents*, just how full a hold is.
 * Each capacity is a {total, remaining} pair, NOT a plain number.
 *
 * Which keys appear varies by entity type:
 *   ships / stations / vehicles → weight, volume, passenger
 *   droids / items / npcs       → weight, volume
 *   facilities                  → volume, passenger (no weight)
 *   cities / creatures / materials / planets → `cargo` is `{}`
 */
interface EntityCapacity { total: number; remaining: number }
interface EntityCargo {
  weightcapacity?: EntityCapacity;
  volumecapacity?: EntityCapacity;
  passengercapacity?: EntityCapacity;
}
interface EntitySkill { attributes: { type: string }; value: number }
interface EntitySkillGroup {
  attributes: { force: string; count: number };
  skill: EntitySkill[];
}
interface EntitySkills {
  general?: EntitySkillGroup[]; space?: EntitySkillGroup[]; ground?: EntitySkillGroup[];
  social?: EntitySkillGroup[]; science?: EntitySkillGroup[];
}
/**
 * `x`/`y` are present on planet and station deposits (63/63 observed) but absent on
 * facility deposits (3/3 observed), so they must be optional.
 */
interface EntityDeposit {
  attributes: { uid: string; href: string; quantity: number; x?: number; y?: number };
  value: string;
}
interface EntityDeposits { deposit: EntityDeposit[] }
interface PlanetaryStats {
  crime: number; morale: number; taxLevel: number; er: number;
  population: number; hireable: number; civLevel: number;
}
```

### 2. Actions

```ts
interface EntityActionDelay { total: number; remaining: number }

interface EntityProducingRef {
  attributes: { uid: string; type: string; href: string };
  value: string;
}

interface EntityActionValue {
  /** Display string for the action type, e.g. "Mining", "Entity Production". */
  actiontype: string;

  /** Timer fields — optional; absent on actions with no timer running. */
  status?: string;
  delay?: EntityActionDelay;

  /** MiningAction */
  repeating?: string;
  'expected-yield'?: number;
  'expected-cost'?: number;
  droids?: number;

  /** MiningAction and EntityProductionAction */
  workers?: number;

  /** EntityProductionAction — `entity` is empty when the slot is idle. */
  quantity?: number;
  producing?: { entity: EntityProducingRef[] };

  /**
   * RetoolingAction — the type being retooled to.
   * Note: this is an object ref, unlike the sibling `attributes.type` string.
   */
  type?: EntityRef;

  /** Unobserved action variants. */
  [key: string]: unknown;
}

/**
 * Observed action types. This list is NOT exhaustive — the server has action types
 * we have not seen, so it must never be modelled as a closed union.
 */
type KnownActionType =
  | 'MiningAction'
  | 'EntityProductionAction'
  | 'RetoolingAction'
  | 'SublightTravelAction'
  | 'AsteroidMiningSoloAction'
  | 'CargoDelayAction'
  | 'FacilityConstructionAction'
  | 'AsteroidProspectingAction';

/**
 * `(string & {})` preserves autocomplete for the known literals while still accepting
 * any string, so a new server-side action type degrades to the base shape rather than
 * becoming a compile error for users on an older SDK version.
 */
type EntityActionType = KnownActionType | (string & {});

interface EntityAction {
  /** `type` is the action class discriminator, e.g. "MiningAction". */
  attributes: { type: EntityActionType; id: number };
  value: EntityActionValue;
}

/** Always an array, even for a single action — this is the change Clarr announced. */
interface EntityActions { action: EntityAction[] }
```

Action-specific fields are typed as optional properties on `EntityActionValue` once
observed. The index signature keeps unobserved variants usable without a type assertion.

**Narrowing via exported type guards**, rather than a discriminated union that would go
stale the moment the server adds an action type:

```ts
export function isMiningAction(a: EntityAction): a is EntityAction & { value: MiningActionValue };
export function isRetoolingAction(a: EntityAction): a is EntityAction & { value: RetoolingActionValue };
export function isEntityProductionAction(a: EntityAction): a is EntityAction & { value: EntityProductionActionValue };
```

```ts
if (isRetoolingAction(action)) {
  action.value.type.value;  // EntityRef — "Behemoth-class Star Dreadnaught"
}
action.value.actiontype;    // always available, whatever the type
```

The guiding property: **an unrecognised action type degrades to the base shape rather
than breaking the build.**

### 3. Per-type detail interfaces

Eleven interfaces — `ShipEntityDetail`, `VehicleEntityDetail`, `StationEntityDetail`,
`CityEntityDetail`, `FacilityEntityDetail`, `PlanetEntityDetail`, `ItemEntityDetail`,
`NpcEntityDetail`, `DroidEntityDetail`, `CreatureEntityDetail`, `MaterialEntityDetail` —
each composed from the blocks above, each carrying `actions?: EntityActions`, and each
ending with `[key: string]: unknown`.

Mapped and exposed through a generic `get()`:

```ts
interface InventoryEntityDetailMap {
  ships: ShipEntityDetail; vehicles: VehicleEntityDetail; /* ...11 total */
}

async get<T extends InventoryEntityType>(
  options: { entityType: T; uid: string }
): Promise<InventoryEntityDetailMap[T]>
```

This mirrors how `list()` already uses `InventoryEntityTypeMap`.

### 4. Backwards compatibility

Every detail interface keeps `[key: string]: unknown`, matching the existing
`GenericInventoryEntityValue` convention. Existing callers reading unmodelled fields
continue to compile, so this ships as a **minor** version bump.

The one true fix is `type`: it changes from `string` to `EntityRef`. Code doing
`entity.type` as a string was already broken at runtime, so this corrects a latent bug
rather than introducing a break. It will be called out in the changelog.

`Entity` itself is retained and exported for anyone referencing it directly.

## Testing

**Fixtures.** Promote the capture script to `scripts/capture-inventory-entities.ts` and
commit the captured payloads to `tests/integration/api-responses/inventory/` — a
directory AGENTS.md already documents but which does not exist. Owner/commander/pilot
references and `infotext` are scrubbed before commit.

**Unit tests** (`tests/unit/resources/inventory-entity-detail.test.ts`) assert each
fixture parses into its interface, with explicit coverage of:

- the single-action array envelope (`actions.action` is an array of length 1)
- the **multi-action** array (station `5:718`, two actions)
- an entity with no `actions` key at all
- an action with `status` and `delay` **absent** (`5:718`'s production action)
- `RetoolingAction.value.type` resolving as a ref, not a string
- `producing.entity` when populated and when empty
- NPC `race`/`gender`/`level` and planet `planetaryStats`/`deposits`

These run under `npm test` with mocked HTTP and cost no API budget.

**Integration tests** stay minimal per the repo's rate-limit policy: one detail fetch
per entity type in `tests/integration/`, run only on demand.

## Open items

1. **The action type set is open and only partially mapped.** Eight types are captured;
   `AsteroidMiningSoloAction` implies non-solo variants, and hyperspace travel, docking
   and combat actions have not been observed. This is accepted by design rather than
   treated as a blocker — the open union plus index signature means unseen types are
   usable, just not narrowable. `KnownActionType` and the guard list grow as types are
   observed; adding to them is always additive.

   Method note: 60 *random* detail fetches surfaced one action payload (~1-in-60, since
   almost all entities are idle), while 10 *targeted* fetches of known-busy UIDs surfaced
   six distinct action types. Future gap-filling should ask the account holder for UIDs
   rather than sweep.

2. **Ask Clarr:** is a station's asteroid mining meant to be discoverable from the
   station, or only from the mining ship? Today it is only on the ship.
3. **Assign-type coverage.** Only `owner` was swept (plus `pilot`/`commander` for
   planets). Whether `commander`/`pilot` details differ is unverified.
4. **`cities` and `creatures`** were sampled at 3 each from one account; field
   optionality across a wider population is inferred, not proven.

## Non-goals

- Changing `list()` or `InventoryEntityTypeMap`.
- Modelling write endpoints (`updateProperty`, tags).
- A discriminated union over `attributes.type` for actions — deferred until enough
  variants are observed to make it worthwhile.
