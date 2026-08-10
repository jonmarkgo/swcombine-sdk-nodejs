/**
 * Types for `GET /inventory/{entity_type}/{uid}`.
 *
 * Every shape here was derived from real payloads captured on 2026-08-10; the
 * corresponding fixtures live in `tests/integration/api-responses/inventory/`.
 */

import type {
  EntityTypeRef,
  EntityReference,
  EntityLocation,
  EntityImages,
  EntityStat,
  EntityTags,
} from './index.js';

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
