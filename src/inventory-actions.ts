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
