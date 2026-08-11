# Inventory Entity Detail Types Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `client.inventory.entities.get()` per-entity-type return types, model the `actions` block that the SW Combine API changed, and expose type guards for narrowing action variants.

**Architecture:** Two new source files — `src/types/inventory-detail.ts` for pure types and `src/inventory-actions.ts` for runtime type guards — re-exported from the existing barrel files. `InventoryEntitiesResource.get()` becomes generic over `InventoryEntityType`, mapping through `InventoryEntityDetailMap` exactly as `list()` already maps through `InventoryEntityTypeMap`. All shapes are driven by the 28 real payloads already committed under `tests/integration/api-responses/inventory/`.

**Tech Stack:** TypeScript 5.5 strict, Vitest, triple build (CJS/ESM/types).

> **Post-hoc note:** this plan (and the code snippets below) originally targeted
> `tests/integration/api-responses/inventory/` for the curated fixtures. That path is
> gitignored (see `.gitignore`), so the fixtures were relocated to
> `tests/unit/fixtures/inventory/` to keep them tracked by git. This document is kept
> as a historical record and was not rewritten path-by-path; see
> `docs/superpowers/specs/2026-08-10-inventory-entity-detail-types-design.md` and the
> current source for the corrected path.

## Global Constraints

- Target version for this work: **3.4.0** (minor bump from 3.3.0).
- Every detail interface ends with `[key: string]: unknown` so unmodelled fields stay readable and existing callers keep compiling.
- `attributes.type` on an action is an **open** union — never a closed one. Unknown action types must degrade to the base shape, not break the build.
- Action-specific fields are **always optional**, even inside a known action type: the same action type returns different value shapes depending on the carrying entity (NPC vs facility).
- Only `uid` is required on detail interfaces. Everything else is optional, matching the existing "guard against unpredictable API responses" convention in `src/types/index.ts`.
- No new runtime dependencies. `axios` remains the only one.
- Do not modify `list()`, `InventoryEntityTypeMap`, or any write endpoint.

---

### Task 1: Add a typecheck script that covers tests

Tests are excluded from every existing tsconfig, so type-level work is currently unverified. This task makes the rest of the plan meaningful.

**Files:**
- Create: `tsconfig.typecheck.json`
- Modify: `package.json` (scripts)

**Interfaces:**
- Consumes: nothing.
- Produces: `npm run typecheck` — runs `tsc --noEmit` over `src` **and** `tests`. Later tasks rely on this to prove their types compile.

- [ ] **Step 1: Create the typecheck tsconfig**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["src/**/*", "tests/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 2: Add the script**

In `package.json`, add to `"scripts"` immediately after `"build:watch"`:

```json
"typecheck": "tsc -p tsconfig.typecheck.json",
```

- [ ] **Step 3: Run it and confirm the current tree passes**

Run: `npm run typecheck`
Expected: exits 0 with no output. If it reports errors in existing test files, fix only those errors — do not change `src`.

- [ ] **Step 4: Commit**

```bash
git add tsconfig.typecheck.json package.json
git commit -m "build: add typecheck script covering tests"
```

---

### Task 2: Action types and type guards

**Files:**
- Create: `src/types/inventory-detail.ts`
- Create: `src/inventory-actions.ts`
- Modify: `src/types/index.ts` (append one re-export line)
- Modify: `src/index.ts` (export the guards)
- Test: `tests/unit/inventory-actions.test.ts`

**Interfaces:**
- Consumes: `EntityTypeRef` from `src/types/index.ts` (already exists: `{ value: string; attributes: { uid: string; href: string } }`).
- Produces:
  - types `EntityActionDelay`, `EntityProducingRef`, `EntityActionValue`, `EntityAction`, `EntityActions`, `KnownActionType`, `EntityActionType`
  - guards `isMiningAction`, `isEntityProductionAction`, `isRetoolingAction` — each `(action: EntityAction) => boolean` acting as a TypeScript type predicate.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/inventory-actions.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  isMiningAction,
  isEntityProductionAction,
  isRetoolingAction,
} from '../../src/inventory-actions.js';
import type { EntityAction } from '../../src/types/index.js';

const FIXTURES = join(
  dirname(fileURLToPath(import.meta.url)),
  '../integration/api-responses/inventory'
);
const actionsOf = (file: string): EntityAction[] =>
  JSON.parse(readFileSync(join(FIXTURES, file), 'utf8')).actions.action;

describe('action type guards', () => {
  it('identifies a mining action', () => {
    const [action] = actionsOf('facility-mining.json');
    expect(isMiningAction(action)).toBe(true);
    expect(isRetoolingAction(action)).toBe(false);
    if (isMiningAction(action)) {
      expect(action.value.workers).toBe(12);
    }
  });

  it('identifies a retooling action and narrows its type ref', () => {
    const retooling = actionsOf('station-multi-action.json').find(isRetoolingAction);
    expect(retooling).toBeDefined();
    expect(retooling!.value.type?.value).toBe('Behemoth-class Star Dreadnaught');
  });

  it('identifies entity production', () => {
    const [action] = actionsOf('station-producing.json');
    expect(isEntityProductionAction(action)).toBe(true);
    if (isEntityProductionAction(action)) {
      expect(action.value.producing?.entity[0].attributes.uid).toBe('2:7119317');
    }
  });

  it('returns false for unrecognised action types', () => {
    const [action] = actionsOf('ship-asteroid-prospecting.json');
    expect(isMiningAction(action)).toBe(false);
    expect(isEntityProductionAction(action)).toBe(false);
    expect(isRetoolingAction(action)).toBe(false);
    // Still fully readable via the base shape.
    expect(action.value.actiontype).toBe('Asteroid Prospecting');
  });

  it('does not assume fields exist just because the type matches', () => {
    // Same action type, stripped payload, because an NPC carries it.
    const [npcAction] = actionsOf('npc-producing.json');
    expect(isEntityProductionAction(npcAction)).toBe(true);
    if (isEntityProductionAction(npcAction)) {
      expect(npcAction.value.producing).toBeUndefined();
      expect(npcAction.value.quantity).toBeUndefined();
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/inventory-actions.test.ts`
Expected: FAIL — cannot resolve `../../src/inventory-actions.js`.

- [ ] **Step 3: Create the action types**

Create `src/types/inventory-detail.ts`:

```ts
/**
 * Types for `GET /inventory/{entity_type}/{uid}`.
 *
 * Every shape here was derived from real payloads captured on 2026-08-10; the
 * corresponding fixtures live in `tests/integration/api-responses/inventory/`.
 */

import type { EntityTypeRef, EntityReference, EntityLocation, EntityImages, EntityStat, EntityTags } from './index.js';

/** Timer attached to an action. Absent on actions that are not counting down. */
export interface EntityActionDelay {
  total: number;
  remaining: number;
}

/** Reference to an entity being produced by an EntityProductionAction. */
export interface EntityProducingRef {
  attributes: { uid: string; type: string; href: string };
  value: string;
}

/**
 * Action types observed in the wild. NOT exhaustive — eight were found across
 * fifteen targeted fetches with no sign of saturation, so this list will grow.
 */
export type KnownActionType =
  | 'MiningAction'
  | 'EntityProductionAction'
  | 'RetoolingAction'
  | 'SublightTravelAction'
  | 'AsteroidMiningSoloAction'
  | 'CargoDelayAction'
  | 'FacilityConstructionAction'
  | 'AsteroidProspectingAction';

/**
 * `(string & {})` keeps autocomplete for the known literals while still accepting
 * any string, so a new server-side action type degrades to the base shape instead
 * of becoming a compile error.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export type EntityActionType = KnownActionType | (string & {});

/**
 * The `value` payload of an action.
 *
 * Every field beyond `actiontype` is optional — the same action type returns
 * different shapes depending on which entity carries it. An `EntityProductionAction`
 * on a facility has `quantity`/`workers`/`producing`; on an NPC it has none of them.
 */
export interface EntityActionValue {
  /** Display string, e.g. "Mining", "Entity Production", "Asteroid Mining Solo". */
  actiontype: string;

  /** Timer fields — absent when the action has no timer running. */
  status?: string;
  delay?: EntityActionDelay;

  /** MiningAction */
  repeating?: string;
  'expected-yield'?: number;
  'expected-cost'?: number;
  droids?: number;

  /** MiningAction, EntityProductionAction, FacilityConstructionAction */
  workers?: number;

  /** EntityProductionAction — `entity` is empty when the slot is idle. */
  quantity?: number;
  producing?: { entity: EntityProducingRef[] };

  /**
   * RetoolingAction — the type being retooled to. Note this is an object ref,
   * unlike the sibling `attributes.type` which is a class-name string.
   */
  type?: EntityTypeRef;

  /** Fields belonging to action types not yet observed. */
  [key: string]: unknown;
}

export interface EntityAction {
  /**
   * `type` is the action class discriminator, e.g. "MiningAction".
   * `id` is shared by every entity participating in the same action, so a
   * facility's mining action and its worker NPC's copy carry the same id.
   */
  attributes: { type: EntityActionType; id: number };
  value: EntityActionValue;
}

/** Always an array, even for a single action. */
export interface EntityActions {
  action: EntityAction[];
}
```

- [ ] **Step 4: Create the guards**

Create `src/inventory-actions.ts`:

```ts
/**
 * Runtime type guards for narrowing inventory entity actions.
 *
 * A guard tells you WHICH action you have. It never guarantees a field is
 * present — the same action type returns different value shapes depending on
 * the entity carrying it, so every action-specific field stays optional.
 */

import type { EntityAction, EntityActionValue, EntityProducingRef } from './types/index.js';
import type { EntityTypeRef } from './types/index.js';

/** Narrowed value for a MiningAction. All fields remain optional by design. */
export interface MiningActionValue extends EntityActionValue {
  'expected-yield'?: number;
  'expected-cost'?: number;
  workers?: number;
  droids?: number;
  repeating?: string;
}

/** Narrowed value for an EntityProductionAction. */
export interface EntityProductionActionValue extends EntityActionValue {
  quantity?: number;
  workers?: number;
  producing?: { entity: EntityProducingRef[] };
}

/** Narrowed value for a RetoolingAction. */
export interface RetoolingActionValue extends EntityActionValue {
  type?: EntityTypeRef;
}

/** True when the action is a facility/NPC/droid mining action. */
export function isMiningAction(
  action: EntityAction
): action is EntityAction & { value: MiningActionValue } {
  return action.attributes.type === 'MiningAction';
}

/** True when the action is an entity production action. */
export function isEntityProductionAction(
  action: EntityAction
): action is EntityAction & { value: EntityProductionActionValue } {
  return action.attributes.type === 'EntityProductionAction';
}

/** True when the action is a retooling action. */
export function isRetoolingAction(
  action: EntityAction
): action is EntityAction & { value: RetoolingActionValue } {
  return action.attributes.type === 'RetoolingAction';
}
```

- [ ] **Step 5: Wire up the exports**

Append to the very end of `src/types/index.ts`:

```ts
export * from './inventory-detail.js';
```

In `src/index.ts`, add after the `export { Page } from './pagination/Page.js';` line:

```ts
// Inventory action type guards
export {
  isMiningAction,
  isEntityProductionAction,
  isRetoolingAction,
} from './inventory-actions.js';
export type {
  MiningActionValue,
  EntityProductionActionValue,
  RetoolingActionValue,
} from './inventory-actions.js';
```

- [ ] **Step 6: Run tests and typecheck**

Run: `npx vitest run tests/unit/inventory-actions.test.ts`
Expected: PASS, 5 tests.

Run: `npm run typecheck && npm run build && npm run lint`
Expected: all exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/types/inventory-detail.ts src/inventory-actions.ts src/types/index.ts src/index.ts tests/unit/inventory-actions.test.ts
git commit -m "feat(types): model inventory entity actions with an open type union"
```

---

### Task 3: Shared building blocks and the eleven detail interfaces

**Files:**
- Modify: `src/types/inventory-detail.ts` (append)
- Test: `tests/unit/inventory-detail-types.test.ts`

**Interfaces:**
- Consumes: `EntityActions` from Task 2; `EntityReference`, `EntityLocation`, `EntityImages`, `EntityStat`, `EntityTags`, `EntityTypeRef` from `src/types/index.ts`.
- Produces: `EntityCapacity`, `EntityCargo`, `EntityCreationDate`, `EntityGender`, `EntitySkills`, `EntityDeposits`, `PlanetaryStats`, `FacilityIncome`, `EntityCrewList`, `EntityQueueItems`, the eleven `*EntityDetail` interfaces, and `InventoryEntityDetailMap`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/inventory-detail-types.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type {
  ShipEntityDetail,
  NpcEntityDetail,
  PlanetEntityDetail,
  FacilityEntityDetail,
  ItemEntityDetail,
} from '../../src/types/index.js';

const FIXTURES = join(
  dirname(fileURLToPath(import.meta.url)),
  '../integration/api-responses/inventory'
);
const load = <T>(file: string): T =>
  JSON.parse(readFileSync(join(FIXTURES, file), 'utf8')) as T;

describe('inventory detail interfaces', () => {
  it('types a ship', () => {
    const ship = load<ShipEntityDetail>('ship-idle.json');
    expect(ship.entitytype).toBe('Ship');
    expect(ship.type?.value).toBe('Lambda-class T-4a Shuttle');
    expect(ship.cargo?.weightcapacity?.total).toBeGreaterThan(0);
  });

  it('types an npc including race, gender and level', () => {
    const npc = load<NpcEntityDetail>('npc.json');
    expect(npc.race?.value).toBe('Hutt');
    expect(npc.gender?.attributes.gender).toBe('M');
    expect(npc.level).toBe(1);
    expect(npc.skills?.general?.[0].skill.length).toBeGreaterThan(0);
  });

  it('types a planet including planetaryStats and deposits', () => {
    const planet = load<PlanetEntityDetail>('planet.json');
    expect(planet.planetaryStats?.population).toBeGreaterThan(0);
    expect(planet.deposits?.deposit[0].attributes.x).toBeTypeOf('number');
  });

  it('types facility income and power fields', () => {
    const facility = load<FacilityEntityDetail>('facility-construction.json');
    expect(facility.facilityincome?.currentdebt).toBe(0);
    expect(facility.facilityincome?.income).toBeUndefined();
    expect(facility.ispowered).toBe('Yes');
  });

  it('types a cargo container item', () => {
    const item = load<ItemEntityDetail>('item-cargo-container.json');
    expect(item.cargo?.entitytype?.value).toBe('Standard Flight Suit');
    expect(item.cargo?.maxuses).toBe(35);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run typecheck`
Expected: FAIL — `ShipEntityDetail` and the other four names are not exported.

- [ ] **Step 3: Append the building blocks**

Append to `src/types/inventory-detail.ts`:

```ts
// ============================================================================
// Shared building blocks
// ============================================================================

/** A capacity is a total/remaining pair, never a bare number. */
export interface EntityCapacity {
  total: number;
  remaining: number;
}

/**
 * Cargo capacities, plus container fields on cargo-container items.
 *
 * Which capacities appear varies by entity type:
 * ships/stations/vehicles get all three, droids/items/npcs get weight+volume,
 * facilities get volume+passenger, and cities/creatures/materials/planets
 * return an empty object.
 */
export interface EntityCargo {
  weightcapacity?: EntityCapacity;
  volumecapacity?: EntityCapacity;
  passengercapacity?: EntityCapacity;
  /** Cargo-container items: what the container holds. */
  entitytype?: EntityTypeRef;
  maxuses?: number;
  remaininguses?: number;
}

/** Combine Galactic Time breakdown attached to most entities. */
export interface EntityCreationDate {
  years: number;
  days: number;
  hours: number;
  mins: number;
  secs: number;
  timestamp: number;
}

/** e.g. `{ attributes: { gender: 'M' }, value: 'Male' }` */
export interface EntityGender {
  attributes: { gender: string };
  value: string;
}

export interface EntitySkill {
  attributes: { type: string };
  value: number;
}

export interface EntitySkillGroup {
  attributes: { force: string; count: number };
  skill: EntitySkill[];
}

export interface EntitySkills {
  general?: EntitySkillGroup[];
  space?: EntitySkillGroup[];
  ground?: EntitySkillGroup[];
  social?: EntitySkillGroup[];
  science?: EntitySkillGroup[];
}

/**
 * `x`/`y` are present on planet and station deposits but absent on facility
 * deposits, so they are optional.
 */
export interface EntityDeposit {
  attributes: {
    uid: string;
    href: string;
    quantity: number;
    x?: number;
    y?: number;
  };
  value: string;
}

export interface EntityDeposits {
  deposit: EntityDeposit[];
}

export interface PlanetaryStats {
  crime?: number;
  morale?: number;
  taxLevel?: number;
  er?: number;
  population?: number;
  hireable?: number;
  civLevel?: number;
}

/**
 * Facility income ("FI") data.
 *
 * `income` and `paiddebt` are absent on some facilities. `warnings` is an object
 * in detail payloads but a number in list payloads.
 */
export interface FacilityIncome {
  currentdebt?: number;
  income?: number;
  paiddebt?: number;
  warnings?: number | Record<string, unknown>;
}

export interface EntityCrewList {
  entry: unknown[];
}

/** Power generators the entity draws from. Absent entirely when unpowered. */
export interface EntityPoweredBy {
  pg: EntityReference[];
}

export interface EntityQueueItem {
  entity?: EntityTypeRef;
  name?: string;
  workers?: { attributes: { ideal_workers: number }; value: number };
  controller?: EntityReference;
  status?: string;
  quantity?: number;
  queueorder?: number;
  producedentities?: { producedentity: Record<string, unknown>[] };
  [key: string]: unknown;
}

export interface EntityQueueItems {
  queueitem: EntityQueueItem[];
}
```

- [ ] **Step 4: Append the detail interfaces**

Append to `src/types/inventory-detail.ts`:

```ts
// ============================================================================
// Per-entity-type detail interfaces
// ============================================================================

/**
 * Fields shared by essentially every inventory entity detail response.
 * Only `uid` is guaranteed; the API omits the rest freely.
 */
export interface BaseEntityDetail {
  uid: string;
  /** Entity kind as a plain string, e.g. "Ship". Distinct from `type`. */
  entitytype?: string;
  name?: string;
  owner?: EntityReference;
  commander?: EntityReference;
  pilot?: EntityReference;
  controller?: string;
  infotext?: string;
  images?: EntityImages;
  protected?: string;
  location?: EntityLocation;
  /** Reference to the entity's type/class. */
  type?: EntityTypeRef;
  tags?: EntityTags;
  cargo?: EntityCargo;
  creationdate?: EntityCreationDate;
  weight?: number;
  volume?: number;
  actions?: EntityActions;
  [key: string]: unknown;
}

/** Fields shared by hulled, pilotable craft. */
export interface VesselEntityDetail extends BaseEntityDetail {
  opento?: string;
  wrecked?: string;
  hull?: EntityStat;
  shield?: EntityStat;
  ionic?: EntityStat;
  underconstruction?: string;
  crewlist?: EntityCrewList;
}

export interface ShipEntityDetail extends VesselEntityDetail {
  entitytype?: 'Ship';
  datablocksused?: number;
  datablockstotal?: number;
}

export interface VehicleEntityDetail extends VesselEntityDetail {
  entitytype?: 'Vehicle';
}

export interface StationEntityDetail extends VesselEntityDetail {
  entitytype?: 'Station';
  /** Present while producing: the type the station is tooled to build. */
  tooledto?: EntityTypeRef;
  queueitems?: EntityQueueItems;
  assigneddcs?: Record<string, unknown>;
  deposits?: EntityDeposits;
}

export interface FacilityEntityDetail extends BaseEntityDetail {
  entitytype?: 'Facility';
  opento?: string;
  wrecked?: string;
  hull?: EntityStat;
  shield?: EntityStat;
  ionic?: EntityStat;
  orientation?: string;
  underconstruction?: string;
  crewlist?: EntityCrewList;
  /** "Yes"/"No" on consumers; absent on power generators. */
  ispowered?: string;
  /** Absent entirely when unpowered, not empty. */
  poweredby?: EntityPoweredBy;
  powergenconnectedto?: EntityReference;
  /** Present on power generators, which have no `ispowered`. */
  energyremaining?: number;
  facilityincome?: FacilityIncome;
  deposits?: EntityDeposits;
  tooledto?: EntityTypeRef;
  queueitems?: EntityQueueItems;
}

export interface CityEntityDetail extends BaseEntityDetail {
  entitytype?: 'City';
  buildings?: { building: Record<string, unknown>[] };
  layout?: string;
  hidden?: string;
}

export interface PlanetEntityDetail extends BaseEntityDetail {
  entitytype?: 'Planet';
  planetaryStats?: PlanetaryStats;
  deposits?: EntityDeposits;
}

export interface ItemEntityDetail extends BaseEntityDetail {
  entitytype?: 'Item';
}

export interface MaterialEntityDetail extends BaseEntityDetail {
  entitytype?: 'Material';
  quantity?: number;
}

export interface NpcEntityDetail extends BaseEntityDetail {
  entitytype?: 'NPC';
  race?: EntityTypeRef;
  gender?: EntityGender;
  level?: number;
  hp?: EntityStat;
  skills?: EntitySkills;
}

export interface DroidEntityDetail extends BaseEntityDetail {
  entitytype?: 'Droid';
  wrecked?: string;
  hull?: EntityStat;
  shield?: EntityStat;
  ionic?: EntityStat;
}

export interface CreatureEntityDetail extends BaseEntityDetail {
  entitytype?: 'Creature';
  hp?: EntityStat;
  skills?: EntitySkills;
}

/** Maps an inventory entity type to its detail response shape. */
export interface InventoryEntityDetailMap {
  ships: ShipEntityDetail;
  vehicles: VehicleEntityDetail;
  stations: StationEntityDetail;
  cities: CityEntityDetail;
  facilities: FacilityEntityDetail;
  planets: PlanetEntityDetail;
  items: ItemEntityDetail;
  npcs: NpcEntityDetail;
  droids: DroidEntityDetail;
  creatures: CreatureEntityDetail;
  materials: MaterialEntityDetail;
}
```

- [ ] **Step 5: Run tests, typecheck, build, lint**

Run: `npm run typecheck`
Expected: exit 0.

Run: `npx vitest run tests/unit/inventory-detail-types.test.ts`
Expected: PASS, 5 tests.

Run: `npm run build && npm run lint && npm test`
Expected: all exit 0, all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/types/inventory-detail.ts tests/unit/inventory-detail-types.test.ts
git commit -m "feat(types): add per-entity-type inventory detail interfaces"
```

---

### Task 4: Make `get()` generic

**Files:**
- Modify: `src/resources/InventoryResource.ts:121-123` (the `get` method) and its imports
- Modify: `src/types/index.ts:2277` (`GetEntityOptions`)
- Test: `tests/unit/resources/inventory-entity-detail.test.ts` (append one describe block)

**Interfaces:**
- Consumes: `InventoryEntityDetailMap` from Task 3.
- Produces: `get<T extends InventoryEntityType>(options: { entityType: T; uid: string }): Promise<InventoryEntityDetailMap[T]>`.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/resources/inventory-entity-detail.test.ts`, inside the outermost `describe`:

```ts
  describe('get() return typing', () => {
    it('returns the detail type matching the requested entityType', async () => {
      const http = createMockHttpClient();
      http.get.mockResolvedValue(fixture('npc.json'));
      const resource = new InventoryEntitiesResource(http as never);

      const npc = await resource.get({ entityType: 'npcs', uid: '10:1219' });
      // These property accesses only compile if get() resolved to NpcEntityDetail.
      expect(npc.race?.value).toBe('Hutt');
      expect(npc.level).toBe(1);
    });

    it('returns facility fields for facilities', async () => {
      const http = createMockHttpClient();
      http.get.mockResolvedValue(fixture('facility-mining.json'));
      const resource = new InventoryEntitiesResource(http as never);

      const facility = await resource.get({ entityType: 'facilities', uid: '4:3497164' });
      expect(facility.ispowered).toBe('Yes');
      expect(facility.actions?.action).toHaveLength(1);
    });
  });
```

- [ ] **Step 2: Run typecheck to verify it fails**

Run: `npm run typecheck`
Expected: FAIL — `Property 'race' does not exist on type 'Entity'`.

- [ ] **Step 3: Update `GetEntityOptions`**

Replace `GetEntityOptions` in `src/types/index.ts` (around line 2277) with:

```ts
export interface GetEntityOptions<T extends InventoryEntityType = InventoryEntityType> {
  /** Entity type: 'ships', 'vehicles', 'stations', 'cities', 'facilities', 'planets', 'items', 'npcs', 'droids', 'creatures', or 'materials' */
  entityType: T;
  /** Entity UID, e.g. "2:283" */
  uid: string;
}
```

If the existing interface has additional properties, keep them — only `entityType` changes to the generic parameter.

- [ ] **Step 4: Make `get()` generic**

In `src/resources/InventoryResource.ts`, add `InventoryEntityDetailMap` to the existing type import block, then replace the `get` method (lines ~111-123) with:

```ts
  /**
   * Get a specific inventory entity by type and UID.
   *
   * Returns the entity object directly — not wrapped in a `Page`. The return type
   * is narrowed by `entityType`, so `entityType: 'npcs'` yields an `NpcEntityDetail`
   * with `race`, `gender` and `level`.
   *
   * @returns The entity detail for the requested type.
   * @example
   * const ship = await client.inventory.entities.get({ entityType: 'ships', uid: '2:283' });
   * console.log(ship.name);
   *
   * @example
   * // Actions are always an array, even when there is only one.
   * const facility = await client.inventory.entities.get({ entityType: 'facilities', uid: '4:3497164' });
   * for (const action of facility.actions?.action ?? []) {
   *   console.log(action.value.actiontype);
   * }
   */
  async get<T extends InventoryEntityType>(
    options: GetEntityOptions<T>
  ): Promise<InventoryEntityDetailMap[T]> {
    return this.request<InventoryEntityDetailMap[T]>(
      'GET',
      `/inventory/${options.entityType}/${options.uid}`
    );
  }
```

- [ ] **Step 5: Normalize skill values**

The API returns non-zero skill values inconsistently as `number` or `string` — the
identical value arrives as both `1` and `"1"`, across all five skill groups, with no
predictable rule. Zero is always a number. Verified across 39 NPC/creature captures:
68 of 875 values were strings.

Per an explicit decision from the repo owner, the SDK normalizes these to `number`
rather than exposing `number | string`. This is the only place the SDK rewrites an API
response, so keep it narrow and well-commented.

Add to `src/resources/InventoryResource.ts`, above the class:

```ts
/**
 * Coerce skill values to numbers.
 *
 * The API returns non-zero skill values inconsistently — the same value appears as
 * both `1` and `"1"`, in every skill group, with no rule that predicts which. Zero is
 * always numeric. Normalizing here lets `EntitySkill.value` be honestly typed
 * `number` for consumers.
 *
 * This mutates nothing the caller owns: it operates on the freshly parsed response.
 */
function normalizeSkillValues(entity: unknown): void {
  const skills = (entity as { skills?: Record<string, unknown> })?.skills;
  if (!skills || typeof skills !== 'object') return;

  for (const group of Object.values(skills)) {
    if (!Array.isArray(group)) continue;
    for (const set of group) {
      const list = (set as { skill?: unknown })?.skill;
      if (!Array.isArray(list)) continue;
      for (const skill of list) {
        const entry = skill as { value?: unknown };
        if (typeof entry?.value === 'string' && entry.value.trim() !== '') {
          const asNumber = Number(entry.value);
          if (!Number.isNaN(asNumber)) entry.value = asNumber;
        }
      }
    }
  }
}
```

Then call it in `get()` before returning:

```ts
  async get<T extends InventoryEntityType>(
    options: GetEntityOptions<T>
  ): Promise<InventoryEntityDetailMap[T]> {
    const entity = await this.request<InventoryEntityDetailMap[T]>(
      'GET',
      `/inventory/${options.entityType}/${options.uid}`
    );
    normalizeSkillValues(entity);
    return entity;
  }
```

- [ ] **Step 6: Test the normalization**

Append to `tests/unit/resources/inventory-entity-detail.test.ts`, inside the outermost `describe`:

```ts
  describe('skill value normalization', () => {
    it('coerces string skill values to numbers', async () => {
      const http = createMockHttpClient();
      http.get.mockResolvedValue({
        uid: '10:1',
        entitytype: 'NPC',
        skills: {
          social: [{ attributes: { force: 'false', count: 2 },
                     skill: [{ attributes: { type: 'crafting' }, value: '3' },
                             { attributes: { type: 'medical' }, value: 0 }] }],
        },
      });
      const resource = new InventoryEntitiesResource(http as never);
      const npc = await resource.get({ entityType: 'npcs', uid: '10:1' });

      const social = npc.skills!.social![0].skill;
      expect(social[0].value).toBe(3);
      expect(typeof social[0].value).toBe('number');
      expect(social[1].value).toBe(0);
    });

    it('leaves entities without skills untouched', async () => {
      const http = createMockHttpClient();
      http.get.mockResolvedValue(fixture('ship-idle.json'));
      const resource = new InventoryEntitiesResource(http as never);
      const ship = await resource.get({ entityType: 'ships', uid: '2:283' });
      expect(ship.uid).toBe('2:283');
      expect(ship.skills).toBeUndefined();
    });

    it('normalizes real captured NPC skill values', async () => {
      const http = createMockHttpClient();
      http.get.mockResolvedValue(fixture('npc.json'));
      const resource = new InventoryEntitiesResource(http as never);
      const npc = await resource.get({ entityType: 'npcs', uid: '10:1219' });

      for (const group of Object.values(npc.skills ?? {})) {
        for (const set of group ?? []) {
          for (const skill of set.skill) {
            expect(typeof skill.value).toBe('number');
          }
        }
      }
    });
  });
```

- [ ] **Step 7: Verify**

Run: `npm run typecheck`
Expected: exit 0.

Run: `npm test && npm run build && npm run lint`
Expected: all exit 0.

- [ ] **Step 8: Commit**

```bash
git add src/resources/InventoryResource.ts src/types/index.ts tests/unit/resources/inventory-entity-detail.test.ts
git commit -m "feat(inventory): narrow get() return type and normalize skill values"
```

---

### Task 5: Document the `pilot` assign-type quirk

**Files:**
- Modify: `src/resources/InventoryResource.ts` (the `list()` JSDoc block, around lines 23-66)

**Interfaces:**
- Consumes: nothing.
- Produces: documentation only, no signature change.

- [ ] **Step 1: Add the note to the `list()` JSDoc**

In `src/resources/InventoryResource.ts`, immediately after the existing line that documents `@param options.assignType`, add:

```
   * **Quirk:** planets a character administers are returned under
   * `assignType: 'pilot'`. Both `'owner'` and `'commander'` return 0 for them.
```

And add this example to the existing `@example` block:

```
   * // Administered planets — note the assign type
   * const planets = await client.inventory.entities.list({ uid: '1:12345', entityType: 'planets', assignType: 'pilot' });
```

- [ ] **Step 2: Verify**

Run: `npm run build && npm run lint`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/resources/InventoryResource.ts
git commit -m "docs: note that administered planets use the pilot assign type"
```

---

### Task 6: Version bump and changelog

**Files:**
- Modify: `package.json` (version)
- Create: `CHANGELOG.md`
- Modify: `AGENTS.md` (rate-limit correction)

**Interfaces:**
- Consumes: everything above.
- Produces: version 3.4.0.

- [ ] **Step 1: Bump the version**

In `package.json`, change `"version": "3.3.0"` to `"version": "3.4.0"`.

- [ ] **Step 2: Create the changelog**

Create `CHANGELOG.md`:

```markdown
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
```

- [ ] **Step 3: Correct the rate-limit claim in AGENTS.md**

In `AGENTS.md`, find the integration-test warning that reads "share the global 600 req/hour budget" and replace that phrase with:

```
share a 600 req/hour budget per endpoint pattern (the API enforces limits
per pattern, not one global pool)
```

- [ ] **Step 4: Verify the whole tree**

Run: `npm run typecheck && npm run build && npm run lint && npm test`
Expected: all exit 0, all tests pass.

- [ ] **Step 5: Commit**

```bash
git add package.json CHANGELOG.md AGENTS.md
git commit -m "chore(release): v3.4.0"
```

---

## Self-Review Notes

**Spec coverage:** All design sections map to tasks — building blocks and detail
interfaces (Task 3), actions and the open union (Task 2), guards (Task 2),
generic `get()` (Task 4), the `pilot` quirk (Task 5), fixtures and tests
(already committed). The `Entity.type`/`owner`/`EntityImages` fixes were
committed ahead of this plan and are recorded in the changelog in Task 6.

**Deferred deliberately:** the spec's open items — unobserved action types,
non-solo asteroid mining variants, and `commander`/`pilot` detail coverage —
need live data we do not have. The open union and index signatures mean none of
them block this work.
