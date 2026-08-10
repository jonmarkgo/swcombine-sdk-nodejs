import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { InventoryEntitiesResource } from '../../../src/resources/InventoryResource.js';
import { createMockHttpClient } from '../helpers/mock-http.js';
import type { Entity } from '../../../src/types/index.js';

const FIXTURES = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../integration/api-responses/inventory'
);
const fixture = (name: string) => JSON.parse(readFileSync(join(FIXTURES, name), 'utf8'));

async function getEntity(name: string): Promise<Entity> {
  const http = createMockHttpClient();
  // BaseResource.request('GET', ...) delegates to http.get
  http.get.mockResolvedValue(fixture(name));
  const resource = new InventoryEntitiesResource(http as never);
  return resource.get({ entityType: 'ships', uid: '2:283' });
}

describe('inventory entity detail shape', () => {
  describe('entitytype vs type', () => {
    // Regression: `Entity.type` was declared as a required `string`, but the API
    // returns an object here and puts the string form in `entitytype`.
    it.each([
      ['ship-idle.json', 'Ship'],
      ['npc.json', 'NPC'],
      ['planet.json', 'Planet'],
    ])('%s exposes entitytype as a string', async (file, expected) => {
      const entity = await getEntity(file);
      expect(entity.entitytype).toBe(expected);
      expect(typeof entity.entitytype).toBe('string');
    });

    it('exposes type as a reference object, not a string', async () => {
      const entity = await getEntity('ship-idle.json');
      expect(typeof entity.type).toBe('object');
      expect(entity.type?.value).toBe('Lambda-class T-4a Shuttle');
      expect(entity.type?.attributes.uid).toBe('2:20');
      expect(entity.type?.attributes.href).toContain('/types/ships/');
    });

    it('exposes owner as a reference object', async () => {
      const entity = await getEntity('ship-idle.json');
      expect(entity.owner?.attributes.uid).toBeTruthy();
      expect(entity.owner?.attributes.type).toBe('character');
      expect(typeof entity.owner?.value).toBe('string');
    });
  });

  describe('actions envelope', () => {
    it('omits actions entirely on an idle entity', async () => {
      const entity = await getEntity('ship-idle.json');
      expect(entity.actions).toBeUndefined();
    });

    it('wraps a single action in an array', async () => {
      const entity = (await getEntity('ship-sublight-travel.json')) as any;
      const actions = entity.actions.action;
      expect(Array.isArray(actions)).toBe(true);
      expect(actions).toHaveLength(1);
      expect(actions[0].attributes.type).toBe('SublightTravelAction');
      expect(actions[0].value.actiontype).toBe('Sublight Travel');
      expect(typeof actions[0].attributes.id).toBe('number');
    });

    it('returns multiple actions for an entity running more than one', async () => {
      const entity = (await getEntity('station-multi-action.json')) as any;
      const actions = entity.actions.action;
      expect(actions).toHaveLength(2);
      expect(actions.map((a: any) => a.attributes.type)).toEqual([
        'EntityProductionAction',
        'RetoolingAction',
      ]);
    });

    it('treats status and delay as optional', async () => {
      const [production, retooling] = (
        (await getEntity('station-multi-action.json')) as any
      ).actions!.action as any[];

      expect(production.value.status).toBeUndefined();
      expect(production.value.delay).toBeUndefined();

      expect(retooling.value.status).toBe('running');
      expect(retooling.value.delay.total).toBe(363600);
      expect(retooling.value.delay.remaining).toBe(34909);
    });

    it('exposes the retooling target as a reference, not a string', async () => {
      const actions = ((await getEntity('station-multi-action.json')) as any).actions!.action as any[];
      const retooling = actions.find((a) => a.attributes.type === 'RetoolingAction');
      // NB: `value.type` is an object ref, unlike the sibling `attributes.type` string.
      expect(typeof retooling.value.type).toBe('object');
      expect(retooling.value.type.value).toBe('Behemoth-class Star Dreadnaught');
      expect(retooling.value.type.attributes.uid).toBe('2:316');
    });

    it('carries mining-specific fields', async () => {
      const [mining] = ((await getEntity('facility-mining.json')) as any).actions!.action as any[];
      expect(mining.value.actiontype).toBe('Mining');
      expect(mining.value.status).toBe('running');
      expect(mining.value['expected-yield']).toBe(9363.25);
      expect(mining.value.workers).toBe(12);
      expect(mining.value.droids).toBe(1);
      expect(mining.value.repeating).toBe('yes');
    });

    it('carries production refs, and tolerates an empty producing list', async () => {
      const [producing] = ((await getEntity('station-producing.json')) as any).actions!.action as any[];
      expect(producing.value.producing.entity[0].attributes.type).toBe('ship');

      const idleSlot = (
        ((await getEntity('station-multi-action.json')) as any).actions!.action as any[]
      ).find((a) => a.attributes.type === 'EntityProductionAction');
      expect(idleSlot.value.producing.entity).toEqual([]);
    });
  });

  describe('the action type set is open', () => {
    // AsteroidMiningSoloAction was discovered only after four other types were already
    // observed. Any closed union over attributes.type would have broken on it.
    it('carries an action type beyond the first four observed', async () => {
      const [action] = ((await getEntity('ship-asteroid-mining.json')) as any).actions!.action as any[];
      expect(action.attributes.type).toBe('AsteroidMiningSoloAction');
      expect(action.value.actiontype).toBe('Asteroid Mining Solo');
      expect(action.value.delay.remaining).toBeGreaterThan(0);
    });

    // The same attributes.type does NOT imply the same value shape: an NPC running
    // Entity Production has none of the production fields a facility/station carries.
    it('varies an action type\'s value shape by carrying entity', async () => {
      const [npcAction] = ((await getEntity('npc-producing.json')) as any).actions!.action as any[];
      expect(npcAction.attributes.type).toBe('EntityProductionAction');
      expect(Object.keys(npcAction.value).sort()).toEqual(['actiontype', 'delay', 'status']);
      expect(npcAction.value.quantity).toBeUndefined();
      expect(npcAction.value.workers).toBeUndefined();
      expect(npcAction.value.producing).toBeUndefined();

      const [facAction] = (((await getEntity('facility-producing-batch.json')) as any).actions!
        .action as any[]);
      expect(facAction.attributes.type).toBe('EntityProductionAction');
      expect(facAction.value.producing.entity).toHaveLength(12);
    });

    it('carries an eighth action type, found after the design was drafted', async () => {
      const [action] = (((await getEntity('ship-asteroid-prospecting.json')) as any).actions!
        .action as any[]);
      expect(action.attributes.type).toBe('AsteroidProspectingAction');
      expect(action.value.actiontype).toBe('Asteroid Prospecting');
    });

    it('handles timer-only action types with no extra fields', async () => {
      const [action] = ((await getEntity('ship-cargo-delay.json')) as any).actions!.action as any[];
      expect(action.attributes.type).toBe('CargoDelayAction');
      expect(action.value.actiontype).toBe('Cargo Delay');
      // Timer-only: nothing beyond actiontype/status/delay.
      expect(Object.keys(action.value).sort()).toEqual(['actiontype', 'delay', 'status']);
    });

    // The mining action lives on the ship doing the work, not the station it mines for.
    it('does not report actions on the station being mined for', async () => {
      const station = (await getEntity('station-asteroid-deposits.json')) as any;
      expect(station.actions).toBeUndefined();
      expect(station.deposits.deposit.length).toBeGreaterThan(0);
    });
  });

  describe('facilities', () => {
    it('reports a batch production as one action with many produced entities', async () => {
      const [action] = ((await getEntity('facility-producing-batch.json')) as any).actions!.action as any[];
      expect(action.attributes.type).toBe('EntityProductionAction');
      expect(action.value.quantity).toBe(12);
      // producing.entity length tracks quantity — a genuine variable-length array.
      expect(action.value.producing.entity).toHaveLength(12);
    });

    it('exposes tooledto alongside production', async () => {
      const facility = await getEntity('facility-producing-batch.json');
      expect((facility.tooledto as any).value).toBe('Toscan 8-Q Starfighter');
      expect((facility.tooledto as any).attributes.uid).toBe('2:123');
    });

    it('carries a seventh action type with only workers beyond the timer', async () => {
      const [action] = ((await getEntity('facility-construction.json')) as any).actions!.action as any[];
      expect(action.attributes.type).toBe('FacilityConstructionAction');
      expect(action.value.actiontype).toBe('Facility Construction');
      expect(action.value.workers).toBe(1);
      expect(action.value.status).toBe('paused');
    });

    it('omits income and paiddebt on some facilityincome payloads', async () => {
      const income = (await getEntity('facility-construction.json')).facilityincome as any;
      expect(income.currentdebt).toBe(0);
      expect(income.income).toBeUndefined();
      expect(income.paiddebt).toBeUndefined();
      // `warnings` is an object here but a number in list payloads.
      expect(typeof income.warnings).toBe('object');
    });

    it('omits poweredby entirely when unpowered', async () => {
      const facility = await getEntity('facility-unpowered.json');
      expect(facility.ispowered).toBe('No');
      expect(facility.poweredby).toBeUndefined();
      expect(facility.energyremaining).toBeUndefined();
    });

    // Facility deposits lack the x/y that planet and station deposits carry.
    it('omits x/y on facility deposits', async () => {
      const [deposit] = (((await getEntity('facility-mining-deposits.json')) as any).deposits!
        .deposit as any[]);
      expect(deposit.value).toBe('alazhi');
      expect(deposit.attributes.quantity).toBeGreaterThan(0);
      expect(deposit.attributes.x).toBeUndefined();
      expect(deposit.attributes.y).toBeUndefined();
    });

    it('includes x/y on station deposits', async () => {
      const [deposit] = (((await getEntity('station-asteroid-deposits.json')) as any).deposits!
        .deposit as any[]);
      expect(typeof deposit.attributes.x).toBe('number');
      expect(typeof deposit.attributes.y).toBe('number');
    });
  });

  describe('cargo', () => {
    // Capacities are {total, remaining} pairs, not plain numbers.
    it('reports capacity as total/remaining pairs', async () => {
      const cargo = (await getEntity('ship-cargo-delay.json')).cargo as any;
      expect(cargo.weightcapacity).toEqual({ total: 80000, remaining: 8 });
      expect(cargo.volumecapacity.total).toBe(120000);
      expect(typeof cargo.passengercapacity.remaining).toBe('number');
    });

    // The route says how full a hold is, never what is in it.
    it('does not expose cargo contents', async () => {
      const entity = await getEntity('ship-cargo-delay.json');
      const keys = Object.keys(entity);
      expect(keys).toContain('cargo');
      expect(keys.some((k) => /manifest|contents|carrying/i.test(k))).toBe(false);
      expect(Object.keys(entity.cargo as any)).toEqual(
        expect.arrayContaining(['weightcapacity', 'volumecapacity', 'passengercapacity'])
      );
    });
  });

  describe('shapes found by broad sampling', () => {
    // EntityImages declared all four keys as required; most entities return only two.
    it('omits custom image variants on most entity types', async () => {
      const facility = await getEntity('facility-mining.json');
      expect(Object.keys(facility.images as any).sort()).toEqual(['large', 'small']);

      const ship = await getEntity('ship-idle.json');
      expect(ship.images).toHaveProperty('customlarge');
    });

    // `cargo` is not purely a capacity block on cargo-container items.
    it('carries container contents and use counts inside cargo', async () => {
      const cargo = (await getEntity('item-cargo-container.json')).cargo as any;
      expect(cargo.entitytype.value).toBe('Standard Flight Suit');
      expect(cargo.maxuses).toBe(35);
      expect(cargo.remaininguses).toBe(35);
      expect(cargo.weightcapacity).toEqual({ total: 0, remaining: 0 });
    });

    // Action ids are shared by every entity participating in the action.
    it('shares an action id between a facility and its worker NPC', async () => {
      const [facilityAction] = (((await getEntity('facility-mining.json')) as any).actions!
        .action as any[]);
      const [npcAction] = (((await getEntity('npc-mining-worker.json')) as any).actions!.action as any[]);

      expect(npcAction.attributes.id).toBe(facilityAction.attributes.id);
      // The facility holds the rich view; the worker's copy is stripped.
      expect(facilityAction.value.workers).toBe(12);
      expect(npcAction.value.workers).toBeUndefined();
    });

    it('reports a stripped mining action on droids too', async () => {
      const [action] = ((await getEntity('droid-mining.json')) as any).actions!.action as any[];
      expect(action.attributes.type).toBe('MiningAction');
      expect(Object.keys(action.value).sort()).toEqual(['actiontype', 'delay', 'status']);
    });

    // Three-state power model: generators carry energyremaining and no ispowered;
    // consumers carry ispowered + poweredby pointing back at their generator.
    it('identifies a power generator by energyremaining', async () => {
      const pg = await getEntity('facility-powergen.json');
      expect(typeof pg.energyremaining).toBe('number');
      expect(pg.ispowered).toBeUndefined();
      expect(pg.poweredby).toBeUndefined();
    });

    it('links a powered consumer back to its generator', async () => {
      const consumer = await getEntity('facility-powered-consumer.json');
      const generator = await getEntity('facility-powergen.json');

      expect(consumer.ispowered).toBe('Yes');
      expect(consumer.energyremaining).toBeUndefined();
      expect((consumer.poweredby as any).pg[0].attributes.uid).toBe(generator.uid);
    });
  });

  describe('per-type fields the SDK does not yet model', () => {
    it('npc carries race, gender, level and skills', async () => {
      const npc = await getEntity('npc.json');
      expect((npc.race as any).value).toBe('Hutt');
      expect((npc.gender as any).value).toBe('Male');
      expect((npc.gender as any).attributes.gender).toBe('M');
      expect(npc.level).toBe(1);
      expect((npc.skills as any).general[0].skill.length).toBeGreaterThan(0);
    });

    it('planet carries planetaryStats and deposits', async () => {
      const planet = await getEntity('planet.json');
      expect((planet.planetaryStats as any).population).toBeGreaterThan(0);
      expect((planet.planetaryStats as any)).toHaveProperty('civLevel');
      expect((planet.deposits as any).deposit[0].attributes.quantity).toBeGreaterThan(0);
    });

    it('producing station carries a production queue', async () => {
      const station = await getEntity('station-producing.json');
      const queue = (station.queueitems as any).queueitem;
      expect(Array.isArray(queue)).toBe(true);
      expect(queue[0].status).toBe('producing');
      expect(queue[0].entity.value).toBe('MC-80a Star Cruiser');
      expect(queue[0].workers.attributes.ideal_workers).toBe(240);
    });
  });
});
