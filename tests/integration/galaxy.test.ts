/**
 * Integration tests for Galaxy resource
 * Tests all read-only Galaxy endpoints
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SWCombine } from '../../src/index.js';
import {
  createTestClient,
  saveResponse,
  TEST_CONFIG,
  expectArray,
  expectFields,
} from './setup.js';

function expectListItemAttributes(items: unknown[]): void {
  if (items.length > 0) {
    expect(items[0]).toHaveProperty('attributes.uid');
    expect(items[0]).toHaveProperty('attributes.name');
  }
}

function expectRawListShape(
  response: unknown,
  itemKey: 'planet' | 'sector' | 'system' | 'station' | 'city'
): void {
  expect(response).toBeDefined();
  expect(typeof response).toBe('object');
  expect(response).not.toBeNull();
  const raw = response as Record<string, unknown>;

  if ('attributes' in raw) {
    expect(typeof raw.attributes).toBe('object');
  }

  if (itemKey in raw && raw[itemKey] !== undefined) {
    expect(Array.isArray(raw[itemKey])).toBe(true);
  }
}

describe('Galaxy Resource Integration Tests', () => {
  let client: SWCombine;

  beforeAll(() => {
    client = createTestClient();
  });

  describe('Planets', () => {
    it('should list planets', async () => {
      const response = await client.galaxy.planets.list();
      saveResponse('galaxy-planets-list', response);

      expectArray(response, 1);
      expectListItemAttributes(response);
    });

    it('should list planets with raw metadata', async () => {
      const response = await client.galaxy.planets.listRaw();
      saveResponse('galaxy-planets-list-raw', response);
      expectRawListShape(response, 'planet');
    });

    it('should get specific planet by name', async () => {
      const response = await client.galaxy.planets.get({ uid: TEST_CONFIG.planetUid });
      saveResponse('galaxy-planet-get', response);

      expectFields(response, ['uid', 'name']);
    });
  });

  describe('Sectors', () => {
    it('should list sectors', async () => {
      const response = await client.galaxy.sectors.list();
      saveResponse('galaxy-sectors-list', response);

      expectArray(response, 1);
      expectListItemAttributes(response);
    });

    it('should list sectors with raw metadata', async () => {
      const response = await client.galaxy.sectors.listRaw();
      saveResponse('galaxy-sectors-list-raw', response);
      expectRawListShape(response, 'sector');
    });

    it('should get specific sector by name', async () => {
      const response = await client.galaxy.sectors.get({ uid: TEST_CONFIG.sectorUid });
      saveResponse('galaxy-sector-get', response);

      expectFields(response, ['uid', 'name']);
    });
  });

  describe('Systems', () => {
    it('should list systems', async () => {
      const response = await client.galaxy.systems.list();
      saveResponse('galaxy-systems-list', response);

      expectArray(response, 1);
      expectListItemAttributes(response);
    });

    it('should list systems with raw metadata', async () => {
      const response = await client.galaxy.systems.listRaw();
      saveResponse('galaxy-systems-list-raw', response);
      expectRawListShape(response, 'system');
    });

    it('should get specific system by name', async () => {
      const response = await client.galaxy.systems.get({ uid: TEST_CONFIG.systemUid });
      saveResponse('galaxy-system-get', response);

      expectFields(response, ['uid', 'name']);
    });
  });

  describe('Stations', () => {
    it('should list stations', async () => {
      const response = await client.galaxy.stations.list();
      saveResponse('galaxy-stations-list', response);

      expectArray(response);
      expectListItemAttributes(response);
      // Stations list may be empty
    });

    it('should list stations with raw metadata', async () => {
      const response = await client.galaxy.stations.listRaw();
      saveResponse('galaxy-stations-list-raw', response);
      expectRawListShape(response, 'station');
    });

    it('should get specific station if available', async () => {
      const stations = await client.galaxy.stations.list();
      if ((stations as any[]).length === 0) {
        console.log('⊘ Skipping: No stations available');
        return;
      }

      const stationUid = (stations as any[])[0].attributes?.uid || (stations as any[])[0].uid;
      const response = await client.galaxy.stations.get({ uid: stationUid });
      saveResponse('galaxy-station-get', response);

      expectFields(response, ['uid', 'name']);
    });
  });

  describe('Cities', () => {
    it('should list cities', async () => {
      const response = await client.galaxy.cities.list();
      saveResponse('galaxy-cities-list', response);

      expectArray(response);
      expectListItemAttributes(response);
      // Cities list may be empty
    });

    it('should list cities with raw metadata', async () => {
      const response = await client.galaxy.cities.listRaw();
      saveResponse('galaxy-cities-list-raw', response);
      expectRawListShape(response, 'city');
    });

    it('should get specific city if available', async () => {
      const cities = await client.galaxy.cities.list();
      if ((cities as any[]).length === 0) {
        console.log('⊘ Skipping: No cities available');
        return;
      }

      const cityUid = (cities as any[])[0].attributes?.uid || (cities as any[])[0].uid;
      const response = await client.galaxy.cities.get({ uid: cityUid });
      saveResponse('galaxy-city-get', response);

      expectFields(response, ['uid', 'name']);
    });
  });
});
