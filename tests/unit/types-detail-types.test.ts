import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { TypesShipEntity, TypesStationEntity } from '../../src/types/index.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), 'fixtures/types');
const load = <T>(file: string): T => JSON.parse(readFileSync(join(FIXTURES, file), 'utf8')) as T;

describe('types detail interfaces', () => {
  it('types ship shield arcs, armour and garrisons', () => {
    const ship = load<TypesShipEntity>('ship-shield-arcs.json');
    expect(ship.shieldArcTemplate).toBe(6);
    expect(ship.armour).toBe(90);
    const arcs = ship.shieldArcs ?? [];
    expect(arcs.map((a) => a.arc)).toContain('Omnidirectional');
    expect(arcs.reduce((sum, a) => sum + a.shield, 0)).toBe(ship.shield);
    const garrisons = ship.garrisons && 'garrison' in ship.garrisons ? ship.garrisons.garrison : [];
    expect(garrisons?.[0]?.garrisonType).toBe('Infantry');
  });

  it('types station armour', () => {
    const station = load<TypesStationEntity>('station-armour.json');
    expect(station.armour).toBe(160);
  });
});
