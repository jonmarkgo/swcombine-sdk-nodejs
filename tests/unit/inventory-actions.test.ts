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
