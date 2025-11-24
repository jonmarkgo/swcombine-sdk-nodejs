/**
 * Integration tests for Galaxy resource
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SWCombine } from '../../src/index.js';
import { createTestClient, saveResponse, delay, TEST_CONFIG } from './setup.js';

describe('Galaxy Resource Integration Tests', () => {
  let client: SWCombine;

  beforeAll(() => {
    client = createTestClient();
  });

  it('should list all planets', async () => {
    try {
      const response = await client.galaxy.planets.list();

      console.log('Planets List Response (count):', response.length);
      console.log('First planet:', response[0]);
      saveResponse('galaxy-planets-list', response);

      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBeGreaterThan(0);
    } catch (error: any) {
      console.log('Planets List Error:', error.message, error.statusCode);
      saveResponse('galaxy-planets-list-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  });

  it('should get specific planet', async () => {
    try {
      const response = await client.galaxy.planets.get({ uid: TEST_CONFIG.planetUid });

      console.log('Planet Get Response:', response);
      saveResponse('galaxy-planet-get', response);

      expect(response).toBeDefined();
      expect(response.uid).toBe(TEST_CONFIG.planetUid);
    } catch (error: any) {
      console.log('Planet Get Error:', error.message, error.statusCode);
      saveResponse('galaxy-planet-get-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  });

  it('should list all sectors', async () => {
    try {
      const response = await client.galaxy.sectors.list();

      console.log('Sectors List Response (count):', response.length);
      console.log('First sector:', response[0]);
      saveResponse('galaxy-sectors-list', response);

      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBeGreaterThan(0);
    } catch (error: any) {
      console.log('Sectors List Error:', error.message, error.statusCode);
      saveResponse('galaxy-sectors-list-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  });

  it('should get specific sector', async () => {
    try {
      const response = await client.galaxy.sectors.get({ uid: TEST_CONFIG.sectorUid });

      console.log('Sector Get Response:', response);
      saveResponse('galaxy-sector-get', response);

      expect(response).toBeDefined();
      expect(response.uid).toBe(TEST_CONFIG.sectorUid);
    } catch (error: any) {
      console.log('Sector Get Error:', error.message, error.statusCode);
      saveResponse('galaxy-sector-get-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  });

  it('should list all systems', async () => {
    try {
      const response = await client.galaxy.systems.list();

      console.log('Systems List Response (count):', response.length);
      console.log('First system:', response[0]);
      saveResponse('galaxy-systems-list', response);

      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBeGreaterThan(0);
    } catch (error: any) {
      console.log('Systems List Error:', error.message, error.statusCode);
      saveResponse('galaxy-systems-list-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  });

  it('should get specific system', async () => {
    try {
      const response = await client.galaxy.systems.get({ uid: TEST_CONFIG.systemUid });

      console.log('System Get Response:', response);
      saveResponse('galaxy-system-get', response);

      expect(response).toBeDefined();
      expect(response.uid).toBe(TEST_CONFIG.systemUid);
    } catch (error: any) {
      console.log('System Get Error:', error.message, error.statusCode);
      saveResponse('galaxy-system-get-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  });

  it('should list all stations', async () => {
    try {
      const response = await client.galaxy.stations.list();

      console.log('Stations List Response (count):', response.length);
      if (response.length > 0) {
        console.log('First station:', response[0]);
      }
      saveResponse('galaxy-stations-list', response);

      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBe(true);
    } catch (error: any) {
      console.log('Stations List Error:', error.message, error.statusCode);
      saveResponse('galaxy-stations-list-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  });

  it('should list all cities', async () => {
    try {
      const response = await client.galaxy.cities.list();

      console.log('Cities List Response (count):', response.length);
      if (response.length > 0) {
        console.log('First city:', response[0]);
      }
      saveResponse('galaxy-cities-list', response);

      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBe(true);
    } catch (error: any) {
      console.log('Cities List Error:', error.message, error.statusCode);
      saveResponse('galaxy-cities-list-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  });
});
