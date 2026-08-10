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
