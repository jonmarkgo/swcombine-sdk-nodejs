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

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), 'fixtures/inventory');
const load = <T>(file: string): T => JSON.parse(readFileSync(join(FIXTURES, file), 'utf8')) as T;

// Compile-time only: never called. Proves get() narrows by entityType — an
// NPC-only field is not reachable on a ships result. `ship` here keeps its
// real `ShipEntityDetail` type (unlike a narrowed-to-`never` runtime guard
// would), so the suppressed error below is the genuine one: `race` resolves
// through BaseEntityDetail's `[key: string]: unknown` index signature, and
// chaining `.value` off `unknown` is a type error.
function _assertShipDoesNotExposeNpcFields(ship: ShipEntityDetail) {
  // @ts-expect-error - `race` is NPC-only; on a ship it is `unknown`, so chaining errors.
  void ship.race.value;
}

describe('inventory detail interfaces', () => {
  it('types a ship', () => {
    const ship = load<ShipEntityDetail>('ship-idle.json');
    expect(ship.entitytype).toBe('Ship');
    expect(ship.type?.value).toBe('Lambda-class T-4a Shuttle');
    expect(ship.cargo?.weightcapacity?.total).toBeGreaterThan(0);
  });

  it('does not type NPC-only fields on a ship result', () => {
    const ship = load<ShipEntityDetail>('ship-idle.json');
    // Ships genuinely carry no `race` field at runtime.
    expect(ship.race).toBeUndefined();

    // `race` is not declared on ShipEntityDetail. BaseEntityDetail's
    // `[key: string]: unknown` index signature lets `ship.race` compile (as
    // `unknown`), but chaining into `.value` the way NpcEntityDetail callers do
    // must fail to compile — that is the whole point of per-type narrowing. See
    // `_assertShipDoesNotExposeNpcFields` above: it is never called (this is a
    // compile-time-only check), which keeps `ship`'s real `ShipEntityDetail`
    // type intact so the suppressed error is the genuine narrowing failure,
    // not an unrelated `never`-has-no-properties error. If the
    // `@ts-expect-error` there ever reports as unused, narrowing has
    // regressed and that should be reported, not silently deleted.
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
