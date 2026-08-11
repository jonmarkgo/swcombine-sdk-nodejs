import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { InventoryEntitiesResource } from '../../../src/resources/InventoryResource.js';
import { createMockHttpClient } from '../helpers/mock-http.js';
import type { InventoryEntityDetailMap, InventoryEntityType } from '../../../src/types/index.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '../fixtures/inventory');
const fixture = (name: string) => JSON.parse(readFileSync(join(FIXTURES, name), 'utf8'));

async function getEntity<T extends InventoryEntityType>(
  name: string,
  entityType: T
): Promise<InventoryEntityDetailMap[T]> {
  const http = createMockHttpClient();
  // BaseResource.request('GET', ...) delegates to http.get
  http.get.mockResolvedValue(fixture(name));
  const resource = new InventoryEntitiesResource(http as never);
  return resource.get({ entityType, uid: '2:283' });
}

describe('inventory entity detail shape', () => {
  describe('entitytype vs type', () => {
    // Regression: `Entity.type` was declared as a required `string`, but the API
    // returns an object here and puts the string form in `entitytype`.
    it.each([
      ['ship-idle.json', 'Ship', 'ships'],
      ['npc.json', 'NPC', 'npcs'],
      ['planet.json', 'Planet', 'planets'],
    ] as const)('%s exposes entitytype as a string', async (file, expected, entityType) => {
      const entity = await getEntity(file, entityType);
      expect(entity.entitytype).toBe(expected);
      expect(typeof entity.entitytype).toBe('string');
    });

    it('exposes type as a reference object, not a string', async () => {
      const entity = await getEntity('ship-idle.json', 'ships');
      expect(typeof entity.type).toBe('object');
      expect(entity.type?.value).toBe('Lambda-class T-4a Shuttle');
      expect(entity.type?.attributes.uid).toBe('2:20');
      expect(entity.type?.attributes.href).toContain('/types/ships/');
    });

    it('exposes owner as a reference object', async () => {
      const entity = await getEntity('ship-idle.json', 'ships');
      expect(entity.owner?.attributes.uid).toBeTruthy();
      expect(entity.owner?.attributes.type).toBe('character');
      expect(typeof entity.owner?.value).toBe('string');
    });
  });

  describe('actions envelope', () => {
    it('omits actions entirely on an idle entity', async () => {
      const entity = await getEntity('ship-idle.json', 'ships');
      expect(entity.actions).toBeUndefined();
    });

    it('wraps a single action in an array', async () => {
      const entity = await getEntity('ship-sublight-travel.json', 'ships');
      const actions = entity.actions!.action;
      expect(Array.isArray(actions)).toBe(true);
      expect(actions).toHaveLength(1);
      expect(actions[0].attributes.type).toBe('SublightTravelAction');
      expect(actions[0].value.actiontype).toBe('Sublight Travel');
      expect(typeof actions[0].attributes.id).toBe('number');
    });

    it('returns multiple actions for an entity running more than one', async () => {
      const entity = await getEntity('station-multi-action.json', 'stations');
      const actions = entity.actions!.action;
      expect(actions).toHaveLength(2);
      expect(actions.map((a) => a.attributes.type)).toEqual([
        'EntityProductionAction',
        'RetoolingAction',
      ]);
    });

    it('treats status and delay as optional', async () => {
      const entity = await getEntity('station-multi-action.json', 'stations');
      const [production, retooling] = entity.actions!.action;

      expect(production.value.status).toBeUndefined();
      expect(production.value.delay).toBeUndefined();

      expect(retooling.value.status).toBe('running');
      expect(retooling.value.delay!.total).toBe(363600);
      expect(retooling.value.delay!.remaining).toBe(34909);
    });

    it('exposes the retooling target as a reference, not a string', async () => {
      const entity = await getEntity('station-multi-action.json', 'stations');
      const actions = entity.actions!.action;
      const retooling = actions.find((a) => a.attributes.type === 'RetoolingAction')!;
      // NB: `value.type` is an object ref, unlike the sibling `attributes.type` string.
      expect(typeof retooling.value.type).toBe('object');
      expect(retooling.value.type!.value).toBe('Behemoth-class Star Dreadnaught');
      expect(retooling.value.type!.attributes.uid).toBe('2:316');
    });

    it('carries mining-specific fields', async () => {
      const facility = await getEntity('facility-mining.json', 'facilities');
      const [mining] = facility.actions!.action;
      expect(mining.value.actiontype).toBe('Mining');
      expect(mining.value.status).toBe('running');
      expect(mining.value['expected-yield']).toBe(9363.25);
      expect(mining.value.workers).toBe(12);
      expect(mining.value.droids).toBe(1);
      expect(mining.value.repeating).toBe('yes');
    });

    it('carries production refs, and tolerates an empty producing list', async () => {
      const producingStation = await getEntity('station-producing.json', 'stations');
      const [producing] = producingStation.actions!.action;
      expect(producing.value.producing!.entity[0].attributes.type).toBe('ship');

      const multiActionStation = await getEntity('station-multi-action.json', 'stations');
      const idleSlot = multiActionStation.actions!.action.find(
        (a) => a.attributes.type === 'EntityProductionAction'
      )!;
      expect(idleSlot.value.producing!.entity).toEqual([]);
    });
  });

  describe('the action type set is open', () => {
    // AsteroidMiningSoloAction was discovered only after four other types were already
    // observed. Any closed union over attributes.type would have broken on it.
    it('carries an action type beyond the first four observed', async () => {
      const ship = await getEntity('ship-asteroid-mining.json', 'ships');
      const [action] = ship.actions!.action;
      expect(action.attributes.type).toBe('AsteroidMiningSoloAction');
      expect(action.value.actiontype).toBe('Asteroid Mining Solo');
      expect(action.value.delay!.remaining).toBeGreaterThan(0);
    });

    // The same attributes.type does NOT imply the same value shape: an NPC running
    // Entity Production has none of the production fields a facility/station carries.
    it("varies an action type's value shape by carrying entity", async () => {
      const npc = await getEntity('npc-producing.json', 'npcs');
      const [npcAction] = npc.actions!.action;
      expect(npcAction.attributes.type).toBe('EntityProductionAction');
      expect(Object.keys(npcAction.value).sort()).toEqual(['actiontype', 'delay', 'status']);
      expect(npcAction.value.quantity).toBeUndefined();
      expect(npcAction.value.workers).toBeUndefined();
      expect(npcAction.value.producing).toBeUndefined();

      const facility = await getEntity('facility-producing-batch.json', 'facilities');
      const [facAction] = facility.actions!.action;
      expect(facAction.attributes.type).toBe('EntityProductionAction');
      expect(facAction.value.producing!.entity).toHaveLength(12);
    });

    it('carries an eighth action type, found after the design was drafted', async () => {
      const ship = await getEntity('ship-asteroid-prospecting.json', 'ships');
      const [action] = ship.actions!.action;
      expect(action.attributes.type).toBe('AsteroidProspectingAction');
      expect(action.value.actiontype).toBe('Asteroid Prospecting');
    });

    it('handles timer-only action types with no extra fields', async () => {
      const ship = await getEntity('ship-cargo-delay.json', 'ships');
      const [action] = ship.actions!.action;
      expect(action.attributes.type).toBe('CargoDelayAction');
      expect(action.value.actiontype).toBe('Cargo Delay');
      // Timer-only: nothing beyond actiontype/status/delay.
      expect(Object.keys(action.value).sort()).toEqual(['actiontype', 'delay', 'status']);
    });

    // The mining action lives on the ship doing the work, not the station it mines for.
    it('does not report actions on the station being mined for', async () => {
      const station = await getEntity('station-asteroid-deposits.json', 'stations');
      expect(station.actions).toBeUndefined();
      expect(station.deposits!.deposit.length).toBeGreaterThan(0);
    });
  });

  describe('facilities', () => {
    it('reports a batch production as one action with many produced entities', async () => {
      const facility = await getEntity('facility-producing-batch.json', 'facilities');
      const [action] = facility.actions!.action;
      expect(action.attributes.type).toBe('EntityProductionAction');
      expect(action.value.quantity).toBe(12);
      // producing.entity length tracks quantity — a genuine variable-length array.
      expect(action.value.producing!.entity).toHaveLength(12);
    });

    it('exposes tooledto alongside production', async () => {
      const facility = await getEntity('facility-producing-batch.json', 'facilities');
      expect(facility.tooledto!.value).toBe('Toscan 8-Q Starfighter');
      expect(facility.tooledto!.attributes.uid).toBe('2:123');
    });

    it('carries a seventh action type with only workers beyond the timer', async () => {
      const facility = await getEntity('facility-construction.json', 'facilities');
      const [action] = facility.actions!.action;
      expect(action.attributes.type).toBe('FacilityConstructionAction');
      expect(action.value.actiontype).toBe('Facility Construction');
      expect(action.value.workers).toBe(1);
      expect(action.value.status).toBe('paused');
    });

    it('omits income and paiddebt on some facilityincome payloads', async () => {
      const facility = await getEntity('facility-construction.json', 'facilities');
      const income = facility.facilityincome!;
      expect(income.currentdebt).toBe(0);
      expect(income.income).toBeUndefined();
      expect(income.paiddebt).toBeUndefined();
      // `warnings` is an object here but a number in list payloads.
      expect(typeof income.warnings).toBe('object');
    });

    it('omits poweredby entirely when unpowered', async () => {
      const facility = await getEntity('facility-unpowered.json', 'facilities');
      expect(facility.ispowered).toBe('No');
      expect(facility.poweredby).toBeUndefined();
      expect(facility.energyremaining).toBeUndefined();
    });

    // Facility deposits lack the x/y that planet and station deposits carry.
    it('omits x/y on facility deposits', async () => {
      const facility = await getEntity('facility-mining-deposits.json', 'facilities');
      const [deposit] = facility.deposits!.deposit;
      expect(deposit.value).toBe('alazhi');
      expect(deposit.attributes.quantity).toBeGreaterThan(0);
      expect(deposit.attributes.x).toBeUndefined();
      expect(deposit.attributes.y).toBeUndefined();
    });

    it('includes x/y on station deposits', async () => {
      const station = await getEntity('station-asteroid-deposits.json', 'stations');
      const [deposit] = station.deposits!.deposit;
      expect(typeof deposit.attributes.x).toBe('number');
      expect(typeof deposit.attributes.y).toBe('number');
    });
  });

  describe('cargo', () => {
    // Capacities are {total, remaining} pairs, not plain numbers.
    it('reports capacity as total/remaining pairs', async () => {
      const ship = await getEntity('ship-cargo-delay.json', 'ships');
      const cargo = ship.cargo!;
      expect(cargo.weightcapacity).toEqual({ total: 80000, remaining: 8 });
      expect(cargo.volumecapacity!.total).toBe(120000);
      expect(typeof cargo.passengercapacity!.remaining).toBe('number');
    });

    // The route says how full a hold is, never what is in it.
    it('does not expose cargo contents', async () => {
      const entity = await getEntity('ship-cargo-delay.json', 'ships');
      const keys = Object.keys(entity);
      expect(keys).toContain('cargo');
      expect(keys.some((k) => /manifest|contents|carrying/i.test(k))).toBe(false);
      expect(Object.keys(entity.cargo!)).toEqual(
        expect.arrayContaining(['weightcapacity', 'volumecapacity', 'passengercapacity'])
      );
    });
  });

  describe('shapes found by broad sampling', () => {
    // EntityImages declared all four keys as required; most entities return only two.
    it('omits custom image variants on most entity types', async () => {
      const facility = await getEntity('facility-mining.json', 'facilities');
      expect(Object.keys(facility.images!).sort()).toEqual(['large', 'small']);

      const ship = await getEntity('ship-idle.json', 'ships');
      expect(ship.images).toHaveProperty('customlarge');
    });

    // `cargo` is not purely a capacity block on cargo-container items.
    it('carries container contents and use counts inside cargo', async () => {
      const item = await getEntity('item-cargo-container.json', 'items');
      const cargo = item.cargo!;
      expect(cargo.entitytype!.value).toBe('Standard Flight Suit');
      expect(cargo.maxuses).toBe(35);
      expect(cargo.remaininguses).toBe(35);
      expect(cargo.weightcapacity).toEqual({ total: 0, remaining: 0 });
    });

    // Action ids are shared by every entity participating in the action.
    it('shares an action id between a facility and its worker NPC', async () => {
      const facility = await getEntity('facility-mining.json', 'facilities');
      const [facilityAction] = facility.actions!.action;
      const npc = await getEntity('npc-mining-worker.json', 'npcs');
      const [npcAction] = npc.actions!.action;

      expect(npcAction.attributes.id).toBe(facilityAction.attributes.id);
      // The facility holds the rich view; the worker's copy is stripped.
      expect(facilityAction.value.workers).toBe(12);
      expect(npcAction.value.workers).toBeUndefined();
    });

    it('reports a stripped mining action on droids too', async () => {
      const droid = await getEntity('droid-mining.json', 'droids');
      const [action] = droid.actions!.action;
      expect(action.attributes.type).toBe('MiningAction');
      expect(Object.keys(action.value).sort()).toEqual(['actiontype', 'delay', 'status']);
    });

    // Three-state power model: generators carry energyremaining and no ispowered;
    // consumers carry ispowered + poweredby pointing back at their generator.
    it('identifies a power generator by energyremaining', async () => {
      const pg = await getEntity('facility-powergen.json', 'facilities');
      expect(typeof pg.energyremaining).toBe('number');
      expect(pg.ispowered).toBeUndefined();
      expect(pg.poweredby).toBeUndefined();
    });

    it('links a powered consumer back to its generator', async () => {
      const consumer = await getEntity('facility-powered-consumer.json', 'facilities');
      const generator = await getEntity('facility-powergen.json', 'facilities');

      expect(consumer.ispowered).toBe('Yes');
      expect(consumer.energyremaining).toBeUndefined();
      expect(consumer.poweredby!.pg[0].attributes.uid).toBe(generator.uid);
    });
  });

  describe('per-type fields the SDK does not yet model', () => {
    it('npc carries race, gender, level and skills', async () => {
      const npc = await getEntity('npc.json', 'npcs');
      expect(npc.race!.value).toBe('Hutt');
      expect(npc.gender!.value).toBe('Male');
      expect(npc.gender!.attributes.gender).toBe('M');
      expect(npc.level).toBe(1);
      expect(npc.skills!.general![0].skill.length).toBeGreaterThan(0);
    });

    it('planet carries planetaryStats and deposits', async () => {
      const planet = await getEntity('planet.json', 'planets');
      expect(planet.planetaryStats!.population).toBeGreaterThan(0);
      expect(planet.planetaryStats).toHaveProperty('civLevel');
      expect(planet.deposits!.deposit[0].attributes.quantity).toBeGreaterThan(0);
    });

    it('producing station carries a production queue', async () => {
      const station = await getEntity('station-producing.json', 'stations');
      const queue = station.queueitems!.queueitem;
      expect(Array.isArray(queue)).toBe(true);
      expect(queue[0].status).toBe('producing');
      expect(queue[0].entity!.value).toBe('MC-80a Star Cruiser');
      expect(queue[0].workers!.attributes.ideal_workers).toBe(240);
    });
  });

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

  describe('request URL', () => {
    // A typo in the `/inventory/${entityType}/${uid}` template would still pass
    // every other test in this file, since they only assert on the parsed body.
    it('requests the exact path for the given entity type and uid', async () => {
      const http = createMockHttpClient();
      http.get.mockResolvedValue(fixture('ship-idle.json'));
      const resource = new InventoryEntitiesResource(http as never);

      await resource.get({ entityType: 'ships', uid: '2:283' });
      expect(http.get).toHaveBeenCalledWith('/inventory/ships/2:283');
    });

    it('requests the exact path for a different entity type and uid', async () => {
      const http = createMockHttpClient();
      http.get.mockResolvedValue(fixture('npc.json'));
      const resource = new InventoryEntitiesResource(http as never);

      await resource.get({ entityType: 'npcs', uid: '10:1219' });
      expect(http.get).toHaveBeenCalledWith('/inventory/npcs/10:1219');
    });
  });

  describe('skill value normalization', () => {
    it('coerces string skill values to numbers', async () => {
      const http = createMockHttpClient();
      http.get.mockResolvedValue({
        uid: '10:1',
        entitytype: 'NPC',
        skills: {
          social: [
            {
              attributes: { force: 'false', count: 2 },
              skill: [
                { attributes: { type: 'crafting' }, value: '3' },
                { attributes: { type: 'medical' }, value: 0 },
              ],
            },
          ],
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

    // Defensive guards inside normalizeSkillValues — none of these should throw,
    // and each malformed shape should be left exactly as the API sent it.
    describe('defensive guards', () => {
      it('tolerates a skill group that is not an array', async () => {
        const http = createMockHttpClient();
        http.get.mockResolvedValue({
          uid: '10:2',
          entitytype: 'NPC',
          skills: { general: 'not-an-array' },
        });
        const resource = new InventoryEntitiesResource(http as never);

        const npc = await resource.get({ entityType: 'npcs', uid: '10:2' });
        expect(npc.skills!.general).toBe('not-an-array');
      });

      it('tolerates a skill property that is not an array', async () => {
        const http = createMockHttpClient();
        http.get.mockResolvedValue({
          uid: '10:3',
          entitytype: 'NPC',
          skills: {
            general: [{ attributes: { force: 'false', count: 1 }, skill: 'not-an-array' }],
          },
        });
        const resource = new InventoryEntitiesResource(http as never);

        const npc = await resource.get({ entityType: 'npcs', uid: '10:3' });
        expect(npc.skills!.general![0].skill).toBe('not-an-array');
      });

      it('leaves empty, whitespace-only and non-numeric string values alone', async () => {
        const http = createMockHttpClient();
        http.get.mockResolvedValue({
          uid: '10:4',
          entitytype: 'NPC',
          skills: {
            general: [
              {
                attributes: { force: 'false', count: 5 },
                skill: [
                  { attributes: { type: 'empty' }, value: '' },
                  { attributes: { type: 'whitespace' }, value: '   ' },
                  { attributes: { type: 'nonnumeric' }, value: 'n/a' },
                  { attributes: { type: 'number' }, value: 5 },
                  { attributes: { type: 'zero' }, value: 0 },
                ],
              },
            ],
          },
        });
        const resource = new InventoryEntitiesResource(http as never);

        const npc = await resource.get({ entityType: 'npcs', uid: '10:4' });
        const [empty, whitespace, nonnumeric, number, zero] = npc.skills!.general![0].skill;

        expect(empty.value).toBe('');
        expect(whitespace.value).toBe('   ');
        expect(nonnumeric.value).toBe('n/a');
        expect(number.value).toBe(5);
        expect(zero.value).toBe(0);
      });
    });
  });
});
