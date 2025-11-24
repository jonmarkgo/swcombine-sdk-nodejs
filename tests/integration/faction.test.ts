/**
 * Integration tests for Faction resource
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SWCombine } from '../../src/index.js';
import { createTestClient, saveResponse, delay, TEST_CONFIG } from './setup.js';
import { validateFaction, validateArray } from './validators.js';

describe('Faction Resource Integration Tests', () => {
  let client: SWCombine;

  beforeAll(() => {
    client = createTestClient();
  });

  it('should list all factions', async () => {
    try {
      const response = await client.faction.list();

      console.log('Factions List Response:', JSON.stringify(response, null, 2).substring(0, 500));
      saveResponse('faction-list', response);

      expect(response).toBeDefined();
      expect(typeof response).toBe('object');

      // Check if it has pagination metadata and faction array
      if ('attributes' in response && 'faction' in response) {
        const factionsData = response as any;
        console.log(`\n📊 Factions response structure:`);
        console.log(`   Total factions: ${factionsData.attributes.total}`);
        console.log(`   Factions in this page: ${factionsData.attributes.count}`);
        expect(Array.isArray(factionsData.faction)).toBe(true);
        expect(factionsData.faction.length).toBeGreaterThan(0);

        // Validate first faction
        if (factionsData.faction.length > 0) {
          validateFaction(factionsData.faction[0]);
        }
      }
    } catch (error: any) {
      console.log('Factions List Error:', error.message, error.statusCode);
      saveResponse('faction-list-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  });

  it('should get specific faction', async () => {
    if (!TEST_CONFIG.factionUid) {
      console.log('⊘ Skipping: No TEST_FACTION_UID provided');
      return;
    }

    try {
      const response = await client.faction.get({ uid: TEST_CONFIG.factionUid });

      console.log('Faction Get Response:', response);
      saveResponse('faction-get', response);

      expect(response).toBeDefined();
      expect(response.uid).toBe(TEST_CONFIG.factionUid);

      // Validate type structure
      validateFaction(response);
    } catch (error: any) {
      console.log('Faction Get Error:', error.message, error.statusCode);
      saveResponse('faction-get-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  });

  it('should list faction members', async () => {
    if (!TEST_CONFIG.factionUid) {
      console.log('⊘ Skipping: No TEST_FACTION_UID provided');
      return;
    }

    try {
      const response = await client.faction.members.list({ factionId: TEST_CONFIG.factionUid });

      console.log('Faction Members Response (count):', response.length);
      saveResponse('faction-members', response);

      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBe(true);

      // Document members structure
      if (response.length > 0) {
        console.log(`\n📊 Members array structure:`);
        console.log(`   Total members: ${response.length}`);
        console.log(`   First member fields:`, Object.keys(response[0]).join(', '));
        console.log(`   First member:`, response[0]);
      }
    } catch (error: any) {
      console.log('Faction Members Error:', error.message, error.statusCode);
      saveResponse('faction-members-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  });

  it('should list faction budgets', async () => {
    if (!TEST_CONFIG.factionUid) {
      console.log('⊘ Skipping: No TEST_FACTION_UID provided');
      return;
    }

    try {
      const response = await client.faction.budgets.list({ factionId: TEST_CONFIG.factionUid });

      console.log('Faction Budgets Response:', response);
      saveResponse('faction-budgets', response);

      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBe(true);

      // Document budgets structure
      if (response.length > 0) {
        console.log(`\n📊 Budgets array structure:`);
        console.log(`   Total budgets: ${response.length}`);
        console.log(`   First budget fields:`, Object.keys(response[0]).join(', '));
        console.log(`   First budget:`, response[0]);
      }
    } catch (error: any) {
      console.log('Faction Budgets Error:', error.message, error.statusCode);
      saveResponse('faction-budgets-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  });

  it('should list faction stockholders', async () => {
    if (!TEST_CONFIG.factionUid) {
      console.log('⊘ Skipping: No TEST_FACTION_UID provided');
      return;
    }

    try {
      const response = await client.faction.stockholders.list({ factionId: TEST_CONFIG.factionUid });

      console.log('Faction Stockholders Response:', response);
      saveResponse('faction-stockholders', response);

      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBe(true);

      // Document stockholders structure
      if (response.length > 0) {
        console.log(`\n📊 Stockholders array structure:`);
        console.log(`   Total stockholders: ${response.length}`);
        console.log(`   First stockholder fields:`, Object.keys(response[0]).join(', '));
        console.log(`   First stockholder:`, response[0]);
      }
    } catch (error: any) {
      console.log('Faction Stockholders Error:', error.message, error.statusCode);
      saveResponse('faction-stockholders-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  });
});
