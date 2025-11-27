/**
 * Integration tests for Types resource
 * Tests all read-only Types endpoints
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SWCombine } from '../../src/index.js';
import {
  createTestClient,
  saveResponse,
  expectArray,
  expectFields,
} from './setup.js';

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

    it('should list entities of type vehicles', async () => {
      const response = await client.types.entities.list({ entityType: 'vehicles' });
      saveResponse('types-entities-vehicles', response);

      expectArray(response, 1);
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
      expect((entities as any[]).length).toBeGreaterThan(0);

      const entityUid = (entities as any[])[0].attributes?.uid;
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
    });
  });
});
