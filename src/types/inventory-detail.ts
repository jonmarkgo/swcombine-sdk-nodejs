/**
 * Types for `GET /inventory/{entity_type}/{uid}`.
 *
 * Every shape here was derived from real payloads captured on 2026-08-10; the
 * corresponding fixtures live in `tests/integration/api-responses/inventory/`.
 */

import type { EntityTypeRef } from './index.js';

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
