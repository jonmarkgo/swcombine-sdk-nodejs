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
  expectFields,
} from './setup.js';

function expectPageShape(response: unknown): void {
  expect(response).toBeDefined();
  expect(typeof response).toBe('object');
  expect(response).not.toBeNull();
  expectFields(response, ['data', 'total', 'start', 'count', 'hasMore']);
}

function expectListItemAttributes(items: unknown[]): void {
  if (items.length > 0) {
    expect(items[0]).toHaveProperty('attributes.uid');
    expect(items[0]).toHaveProperty('attributes.name');
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

      expectPageShape(response);
      expect(response.data.length).toBeGreaterThanOrEqual(1);
      expectListItemAttributes(response.data);
    });

    it('should list planets with pagination metadata', async () => {
      const response = await client.galaxy.planets.list();
      saveResponse('galaxy-planets-list-page', response);
      expectPageShape(response);
      expect(response.total).toBeGreaterThan(0);
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

      expectPageShape(response);
      expect(response.data.length).toBeGreaterThanOrEqual(1);
      expectListItemAttributes(response.data);
    });

    it('should list sectors with pagination metadata', async () => {
      const response = await client.galaxy.sectors.list();
      saveResponse('galaxy-sectors-list-page', response);
      expectPageShape(response);
      expect(response.total).toBeGreaterThan(0);
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

      expectPageShape(response);
      expect(response.data.length).toBeGreaterThanOrEqual(1);
      expectListItemAttributes(response.data);
    });

    it('should list systems with pagination metadata', async () => {
      const response = await client.galaxy.systems.list();
      saveResponse('galaxy-systems-list-page', response);
      expectPageShape(response);
      expect(response.total).toBeGreaterThan(0);
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

      expectPageShape(response);
      expectListItemAttributes(response.data);
      // Stations list may be empty
    });

    it('should list stations with pagination metadata', async () => {
      const response = await client.galaxy.stations.list();
      saveResponse('galaxy-stations-list-page', response);
      expectPageShape(response);
    });

    it('should get specific station if available', async () => {
      const response = await client.galaxy.stations.list();
      if (response.data.length === 0) {
        console.log('⊘ Skipping: No stations available');
        return;
      }

      const stationUid = (response.data[0] as any).attributes?.uid || (response.data[0] as any).uid;
      const station = await client.galaxy.stations.get({ uid: stationUid });
      saveResponse('galaxy-station-get', station);

      expectFields(station, ['uid', 'name']);
    });
  });

  describe('Cities', () => {
    it('should list cities', async () => {
      const response = await client.galaxy.cities.list();
      saveResponse('galaxy-cities-list', response);

      expectPageShape(response);
      expectListItemAttributes(response.data);
      // Cities list may be empty
    });

    it('should list cities with pagination metadata', async () => {
      const response = await client.galaxy.cities.list();
      saveResponse('galaxy-cities-list-page', response);
      expectPageShape(response);
    });

    it('should get specific city if available', async () => {
      const response = await client.galaxy.cities.list();
      if (response.data.length === 0) {
        console.log('⊘ Skipping: No cities available');
        return;
      }

      const cityUid = (response.data[0] as any).attributes?.uid || (response.data[0] as any).uid;
      const city = await client.galaxy.cities.get({ uid: cityUid });
      saveResponse('galaxy-city-get', city);

      expectFields(city, ['uid', 'name']);
    });
  });
});
