/**
 * Integration tests for Types resource
 * Tests all read-only Types endpoints
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SWCombine } from '../../src/index.js';
import { createTestClient, saveResponse, expectArray, expectFields } from './setup.js';

describe('Types Resource Integration Tests', () => {
  let client: SWCombine;

  beforeAll(() => {
    client = createTestClient();
  });

  describe('Entity Types', () => {
    it('should list all entity types', async () => {
      const response = await client.types.listEntityTypes();
      saveResponse('types-entitytypes', response);

      expectArray(response, 1);
      // Should have many entity types (ships, vehicles, etc.)
      expect((response as any[]).length).toBeGreaterThan(10);
    });
  });

  describe('Classes', () => {
    it('should list classes for ships', async () => {
      const response = await client.types.classes.list({ entityType: 'ships' });
      saveResponse('types-classes-ships', response);

      expectArray(response);
      // Ships should have classes
    });

    it('should list classes for vehicles', async () => {
      const response = await client.types.classes.list({ entityType: 'vehicles' });
      saveResponse('types-classes-vehicles', response);

      expectArray(response);
    });

    it('should list classes with pagination', async () => {
      // NOTE: The API returns all classes regardless of item_count parameter.
      // Pagination is not supported for the classes endpoint - it returns the full list.
      const response = await client.types.classes.list({
        entityType: 'ships',
        start_index: 1,
        item_count: 10,
      });
      saveResponse('types-classes-ships-paginated', response);

      expectArray(response);
      // API returns all classes (pagination not supported for this endpoint)
      expect((response as any[]).length).toBeGreaterThan(0);
    });
  });

  describe('Entities by Type', () => {
    it('should list entities of type ships', async () => {
      const response = await client.types.entities.list({ entityType: 'ships' });
      saveResponse('types-entities-ships', response);

      expectArray(response, 1);
      // Each entity should have attributes
      const entity = (response as any[])[0];
      expectFields(entity, ['attributes']);
    });

    it('should list raw entities payload for ships', async () => {
      const response = await client.types.entities.listRaw({ entityType: 'ships' });
      saveResponse('types-entities-ships-raw', response);

      expect(response.attributes).toBeDefined();
      expect(Array.isArray(response.items)).toBe(true);
      expect(response.items.length).toBeGreaterThan(0);
    });

    it('should list raw entities payload for faction modules', async () => {
      const response = await client.types.entities.listRaw({ entityType: 'factionmodules' });
      saveResponse('types-entities-factionmodules-raw', response);

      expect(response.attributes).toBeDefined();
      expect(Array.isArray(response.items)).toBe(true);
      expect(response.items.length).toBeGreaterThan(0);
      expect(response.items[0]?.attributes?.uid).toBeDefined();
    });

    it('should list entities of type vehicles', async () => {
      const response = await client.types.entities.list({ entityType: 'vehicles' });
      saveResponse('types-entities-vehicles', response);

      expectArray(response, 1);
    });

    it('should list entities of type creatures', async () => {
      const response = await client.types.entities.list({ entityType: 'creatures' });
      saveResponse('types-entities-creatures', response);

      expectArray(response, 1);
      const entity = response[0];
      expect(entity?.attributes?.uid).toBeDefined();
    });

    it('should list entities of type faction modules', async () => {
      const response = await client.types.entities.list({ entityType: 'factionmodules' });
      saveResponse('types-entities-factionmodules', response);

      expectArray(response, 1);
      const entity = response[0];
      expect(entity?.attributes?.uid).toBeDefined();
    });

    it('should list entities of type terrain', async () => {
      const response = await client.types.entities.list({ entityType: 'terrain' });
      saveResponse('types-entities-terrain', response);

      expectArray(response, 1);
      const entity = response[0];
      expect(entity?.attributes?.uid).toBeDefined();
    });

    it('should list entities of type planets', async () => {
      const response = await client.types.entities.list({ entityType: 'planets' });
      saveResponse('types-entities-planets', response);

      expectArray(response, 1);
      const entity = response[0];
      expect(entity?.attributes?.uid).toBeDefined();
    });

    it('should list entities of type weapons', async () => {
      const response = await client.types.entities.list({ entityType: 'weapons' });
      saveResponse('types-entities-weapons', response);

      expectArray(response, 1);
      const entity = response[0];
      expect(entity?.attributes?.uid).toBeDefined();
    });

    it('should list entities of type races', async () => {
      const response = await client.types.entities.list({ entityType: 'races' });
      saveResponse('types-entities-races', response);

      expectArray(response, 1);
      const entity = response[0];
      expect(entity?.attributes?.uid).toBeDefined();
    });

    it('should list entities of type materials', async () => {
      const response = await client.types.entities.list({ entityType: 'materials' });
      saveResponse('types-entities-materials', response);

      expectArray(response, 1);
      const entity = response[0];
      expect(entity?.attributes?.uid).toBeDefined();
    });

    it('should list entities of type droids', async () => {
      const response = await client.types.entities.list({ entityType: 'droids' });
      saveResponse('types-entities-droids', response);

      expectArray(response, 1);
      const entity = response[0];
      expect(entity?.attributes?.uid).toBeDefined();
    });

    it('should list entities of type npcs', async () => {
      const response = await client.types.entities.list({ entityType: 'npcs' });
      saveResponse('types-entities-npcs', response);

      expectArray(response, 1);
      const entity = response[0];
      expect(entity?.attributes?.uid).toBeDefined();
    });

    it('should list entities of type items', async () => {
      const response = await client.types.entities.list({ entityType: 'items' });
      saveResponse('types-entities-items', response);

      expectArray(response, 1);
      const entity = response[0];
      expect(entity?.attributes?.uid).toBeDefined();
    });

    it('should list entities of type facilities', async () => {
      const response = await client.types.entities.list({ entityType: 'facilities' });
      saveResponse('types-entities-facilities', response);

      expectArray(response, 1);
      const entity = response[0];
      expect(entity?.attributes?.uid).toBeDefined();
    });

    it('should list entities of type stations', async () => {
      const response = await client.types.entities.list({ entityType: 'stations' });
      saveResponse('types-entities-stations', response);

      expectArray(response, 1);
      const entity = response[0];
      expect(entity?.attributes?.uid).toBeDefined();
    });

    it('should list entities with pagination', async () => {
      const response = await client.types.entities.list({
        entityType: 'ships',
        start_index: 1,
        item_count: 10,
      });
      saveResponse('types-entities-ships-paginated', response);

      expectArray(response);
      expect((response as any[]).length).toBeLessThanOrEqual(10);
    });

    it('should get specific entity type info', async () => {
      // First get the list to find a valid entity
      const entities = await client.types.entities.list({ entityType: 'ships' });
      expect(entities.length).toBeGreaterThan(0);

      const entityUid = entities[0]?.attributes?.uid;
      if (!entityUid) {
        console.log('⊘ Skipping: No entity UID found in list response');
        return;
      }

      const response = await client.types.entities.get({
        entityType: 'ships',
        uid: entityUid,
      });
      saveResponse('types-entity-get', response);

      expectFields(response, ['uid', 'name']);
      if (response.speed) {
        expect(response.speed).toHaveProperty('hyperspace');
      }
      if (response.weapons?.weapon) {
        expect(Array.isArray(response.weapons.weapon)).toBe(true);
      }
    });

    it('should get specific vehicle type info', async () => {
      const entities = await client.types.entities.list({ entityType: 'vehicles' });
      expect(entities.length).toBeGreaterThan(0);

      const entityUid = entities[0]?.attributes?.uid;
      if (!entityUid) {
        console.log('⊘ Skipping: No vehicle UID found in list response');
        return;
      }

      const response = await client.types.entities.get({
        entityType: 'vehicles',
        uid: entityUid,
      });
      saveResponse('types-vehicle-get', response);

      expectFields(response, ['uid', 'name']);
      if (response.class?.attributes) {
        expect(response.class.attributes.uid).toBeDefined();
      }
      if (response.speed?.planetary) {
        expect(response.speed.planetary.value).toBeDefined();
      }
      if (response.terrainrestrictions?.terrainrestriction) {
        expect(Array.isArray(response.terrainrestrictions.terrainrestriction)).toBe(true);
      }
      if (response.weapons?.weapon) {
        expect(Array.isArray(response.weapons.weapon)).toBe(true);
      }
      if (response.images) {
        expect(response.images.small).toBeDefined();
      }
    });

    it('should get specific creature type info', async () => {
      const entities = await client.types.entities.list({ entityType: 'creatures' });
      expect(entities.length).toBeGreaterThan(0);

      const entityUid = entities[0]?.attributes?.uid;
      if (!entityUid) {
        console.log('⊘ Skipping: No creature UID found in list response');
        return;
      }

      const response = await client.types.entities.get({
        entityType: 'creatures',
        uid: entityUid,
      });
      saveResponse('types-creature-get', response);

      expectFields(response, ['uid', 'name']);
      if (response.class?.attributes) {
        expect(response.class.attributes.uid).toBeDefined();
      }
      if (response.skills?.general) {
        expect(Array.isArray(response.skills.general)).toBe(true);
      }
      if (response.spawnterraintypes?.spawnterraintype) {
        expect(Array.isArray(response.spawnterraintypes.spawnterraintype)).toBe(true);
      }
    });

    it('should get specific faction module type info', async () => {
      const entities = await client.types.entities.list({ entityType: 'factionmodules' });
      expect(entities.length).toBeGreaterThan(0);

      const entityUid = entities[0]?.attributes?.uid;
      if (!entityUid) {
        console.log('⊘ Skipping: No faction module UID found in list response');
        return;
      }

      const response = await client.types.entities.get({
        entityType: 'factionmodules',
        uid: entityUid,
      });
      saveResponse('types-factionmodule-get', response);

      expectFields(response, ['uid', 'name']);
      if (response.datacards?.facilities && 'facility' in response.datacards.facilities) {
        expect(Array.isArray(response.datacards.facilities.facility)).toBe(true);
      }
      if (response.datacards?.stations && 'station' in response.datacards.stations) {
        expect(Array.isArray(response.datacards.stations.station)).toBe(true);
      }
    });

    it('should get specific terrain type info', async () => {
      const entities = await client.types.entities.list({ entityType: 'terrain' });
      expect(entities.length).toBeGreaterThan(0);

      const entityUid = entities[0]?.attributes?.uid;
      if (!entityUid) {
        console.log('⊘ Skipping: No terrain UID found in list response');
        return;
      }

      const response = await client.types.entities.get({
        entityType: 'terrain',
        uid: entityUid,
      });
      saveResponse('types-terrain-get', response);

      expectFields(response, ['uid', 'name']);
      if (response.images) {
        expect(response.images.small).toBeDefined();
      }
      if (response.materialtypes && 'materialtype' in response.materialtypes) {
        expect(Array.isArray(response.materialtypes.materialtype)).toBe(true);
      }
    });

    it('should get specific planet type info', async () => {
      const entities = await client.types.entities.list({ entityType: 'planets' });
      expect(entities.length).toBeGreaterThan(0);

      const entityUid = entities[0]?.attributes?.uid;
      if (!entityUid) {
        console.log('⊘ Skipping: No planet UID found in list response');
        return;
      }

      const response = await client.types.entities.get({
        entityType: 'planets',
        uid: entityUid,
      });
      saveResponse('types-planet-get', response);

      expectFields(response, ['uid', 'name']);
      if (response.images) {
        expect(response.images.small).toBeDefined();
      }
      if (response.images?.larges?.large) {
        expect(Array.isArray(response.images.larges.large)).toBe(true);
      }
    });

    it('should get specific weapon type info', async () => {
      const entities = await client.types.entities.list({ entityType: 'weapons' });
      expect(entities.length).toBeGreaterThan(0);

      const entityUid = entities[0]?.attributes?.uid;
      if (!entityUid) {
        console.log('⊘ Skipping: No weapon UID found in list response');
        return;
      }

      const response = await client.types.entities.get({
        entityType: 'weapons',
        uid: entityUid,
      });
      saveResponse('types-weapon-get', response);

      expectFields(response, ['uid', 'name']);
      if (response.class?.attributes) {
        expect(response.class.attributes.uid).toBeDefined();
      }
      if (response.images) {
        expect(response.images.small).toBeDefined();
      }
      if (typeof response.firepower !== 'undefined') {
        expect(typeof response.firepower).toBe('number');
      }
    });

    it('should get specific race type info', async () => {
      const entities = await client.types.entities.list({ entityType: 'races' });
      expect(entities.length).toBeGreaterThan(0);

      const entityUid = entities[0]?.attributes?.uid;
      if (!entityUid) {
        console.log('⊘ Skipping: No race UID found in list response');
        return;
      }

      const response = await client.types.entities.get({
        entityType: 'races',
        uid: entityUid,
      });
      saveResponse('types-race-get', response);

      expectFields(response, ['uid', 'name']);
      if (response.homeworld?.attributes) {
        expect(response.homeworld.attributes.uid).toBeDefined();
      }
      if (response.skills?.general) {
        expect(Array.isArray(response.skills.general)).toBe(true);
      }
      if (response.terrainrestrictions?.terrainrestriction) {
        expect(Array.isArray(response.terrainrestrictions.terrainrestriction)).toBe(true);
      }
      if (response.images?.female?.image) {
        expect(Array.isArray(response.images.female.image)).toBe(true);
      }
      if (response.images?.male?.image) {
        expect(Array.isArray(response.images.male.image)).toBe(true);
      }
    });

    it('should get specific material type info', async () => {
      const entities = await client.types.entities.list({ entityType: 'materials' });
      expect(entities.length).toBeGreaterThan(0);

      const entityUid = entities[0]?.attributes?.uid;
      if (!entityUid) {
        console.log('⊘ Skipping: No material UID found in list response');
        return;
      }

      const response = await client.types.entities.get({
        entityType: 'materials',
        uid: entityUid,
      });
      saveResponse('types-material-get', response);

      expectFields(response, ['uid', 'name']);
      if (response.weight) {
        expect(response.weight.value).toBeDefined();
      }
      if (response.volume) {
        expect(response.volume.value).toBeDefined();
      }
      if (response.price) {
        expect(response.price.credits).toBeDefined();
      }
      if (response.images) {
        expect(response.images.small).toBeDefined();
      }
    });

    it('should get specific droid type info', async () => {
      const entities = await client.types.entities.list({ entityType: 'droids' });
      expect(entities.length).toBeGreaterThan(0);

      const entityUid = entities[0]?.attributes?.uid;
      if (!entityUid) {
        console.log('⊘ Skipping: No droid UID found in list response');
        return;
      }

      const response = await client.types.entities.get({
        entityType: 'droids',
        uid: entityUid,
      });
      saveResponse('types-droid-get', response);

      expectFields(response, ['uid', 'name']);
      if (response.class?.attributes) {
        expect(response.class.attributes.uid).toBeDefined();
      }
      if (response.skills?.general) {
        expect(Array.isArray(response.skills.general)).toBe(true);
      }
      if (response.terrainrestrictions?.terrainrestriction) {
        expect(Array.isArray(response.terrainrestrictions.terrainrestriction)).toBe(true);
      }
      if (response.materials && 'material' in response.materials) {
        expect(Array.isArray(response.materials.material)).toBe(true);
      }
      if (response.images) {
        expect(response.images.small).toBeDefined();
      }
    });

    it('should get specific npc type info', async () => {
      const entities = await client.types.entities.list({ entityType: 'npcs' });
      expect(entities.length).toBeGreaterThan(0);

      const entityUid = entities[0]?.attributes?.uid;
      if (!entityUid) {
        console.log('⊘ Skipping: No NPC UID found in list response');
        return;
      }

      const response = await client.types.entities.get({
        entityType: 'npcs',
        uid: entityUid,
      });
      saveResponse('types-npc-get', response);

      expectFields(response, ['uid', 'name']);
      if (response.class?.attributes) {
        expect(response.class.attributes.uid).toBeDefined();
      }
      if (response.skills?.general) {
        expect(Array.isArray(response.skills.general)).toBe(true);
      }
      if (response.hiringlocations?.hiringlocation) {
        expect(Array.isArray(response.hiringlocations.hiringlocation)).toBe(true);
      }
      if (response.images) {
        expect(response.images.type).toBeDefined();
      }
    });

    it('should get specific item type info', async () => {
      const entities = await client.types.entities.list({ entityType: 'items' });
      expect(entities.length).toBeGreaterThan(0);

      const entityUid = entities[0]?.attributes?.uid;
      if (!entityUid) {
        console.log('⊘ Skipping: No item UID found in list response');
        return;
      }

      const response = await client.types.entities.get({
        entityType: 'items',
        uid: entityUid,
      });
      saveResponse('types-item-get', response);

      expectFields(response, ['uid', 'name']);
      if (response.class?.attributes) {
        expect(response.class.attributes.uid).toBeDefined();
      }
      if (response.equippableslots?.equippableslot) {
        expect(Array.isArray(response.equippableslots.equippableslot)).toBe(true);
      }
      if (response.materials && 'material' in response.materials) {
        expect(Array.isArray(response.materials.material)).toBe(true);
      }
      if (response.images) {
        expect(response.images.small).toBeDefined();
      }
    });

    it('should get specific facility type info', async () => {
      const entities = await client.types.entities.list({ entityType: 'facilities' });
      expect(entities.length).toBeGreaterThan(0);

      const entityUid = entities[0]?.attributes?.uid;
      if (!entityUid) {
        console.log('⊘ Skipping: No facility UID found in list response');
        return;
      }

      const response = await client.types.entities.get({
        entityType: 'facilities',
        uid: entityUid,
      });
      saveResponse('types-facility-get', response);

      expectFields(response, ['uid', 'name']);
      if (response.class?.attributes) {
        expect(response.class.attributes.uid).toBeDefined();
      }
      if (response.materials && 'material' in response.materials) {
        expect(Array.isArray(response.materials.material)).toBe(true);
      }
      if (response.imagesets?.images) {
        expect(Array.isArray(response.imagesets.images)).toBe(true);
      }
    });

    it('should get specific station type info', async () => {
      const entities = await client.types.entities.list({ entityType: 'stations' });
      expect(entities.length).toBeGreaterThan(0);

      const entityUid = entities[0]?.attributes?.uid;
      if (!entityUid) {
        console.log('⊘ Skipping: No station UID found in list response');
        return;
      }

      const response = await client.types.entities.get({
        entityType: 'stations',
        uid: entityUid,
      });
      saveResponse('types-station-get', response);

      expectFields(response, ['uid', 'name']);
      if (response.garrisons?.garrison) {
        expect(Array.isArray(response.garrisons.garrison)).toBe(true);
      }
      if (response.materials && 'material' in response.materials) {
        expect(Array.isArray(response.materials.material)).toBe(true);
      }
      if (response.images) {
        expect(response.images.small).toBeDefined();
      }
    });
  });
});
