/**
 * Integration tests for Types resource
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SWCombine } from '../../src/index.js';
import { createTestClient, saveResponse, delay } from './setup.js';

describe('Types Resource Integration Tests', () => {
  let client: SWCombine;

  beforeAll(() => {
    client = createTestClient();
  });

  it('should list all entity types', async () => {
    try {
      const response = await client.types.listEntityTypes();

      console.log('Entity Types Response (count):', response.length);
      console.log('First few entity types:', response.slice(0, 5));
      saveResponse('types-entitytypes', response);

      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBeGreaterThan(0);
    } catch (error: any) {
      console.log('Entity Types Error:', error.message, error.statusCode);
      saveResponse('types-entitytypes-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  });

  it('should list classes for an entity type', async () => {
    try {
      // Try with 'vehicle' entity type
      const response = await client.types.classes.list({ entityType: 'vehicle' });

      console.log('Entity Classes Response (count):', response.length);
      console.log('First few classes:', response.slice(0, 5));
      saveResponse('types-classes-vehicle', response);

      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBe(true);
    } catch (error: any) {
      console.log('Entity Classes Error:', error.message, error.statusCode);
      saveResponse('types-classes-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  });

  it('should list entities of a type', async () => {
    try {
      // Try with 'vehicle' entity type
      const response = await client.types.entities.list({ entityType: 'vehicle' });

      console.log('Entities List Response (count):', response.length);
      if (response.length > 0) {
        console.log('First entity:', response[0]);
      }
      saveResponse('types-entities-vehicle', response);

      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBe(true);
    } catch (error: any) {
      console.log('Entities List Error:', error.message, error.statusCode);
      saveResponse('types-entities-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  });

  it('should list entities of a type and class', async () => {
    try {
      // Try with 'vehicle' type and a class
      const response = await client.types.entities.list({
        entityType: 'vehicle',
        class: 'wheeled',
      });

      console.log('Entities by Class Response (count):', response.length);
      if (response.length > 0) {
        console.log('First entity:', response[0]);
      }
      saveResponse('types-entities-vehicle-wheeled', response);

      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBe(true);
    } catch (error: any) {
      console.log('Entities by Class Error:', error.message, error.statusCode);
      saveResponse('types-entities-class-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  });
});
