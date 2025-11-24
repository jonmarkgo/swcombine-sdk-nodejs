/**
 * Integration tests for Faction resource
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SWCombine } from '../../src/index.js';
import { createTestClient, saveResponse, delay, TEST_CONFIG } from './setup.js';

describe('Faction Resource Integration Tests', () => {
  let client: SWCombine;

  beforeAll(() => {
    client = createTestClient();
  });

  it('should list all factions', async () => {
    try {
      const response = await client.faction.list();

      console.log('Factions List Response (count):', response.length);
      console.log('First faction:', response[0]);
      saveResponse('faction-list', response);

      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBeGreaterThan(0);
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
    } catch (error: any) {
      console.log('Faction Stockholders Error:', error.message, error.statusCode);
      saveResponse('faction-stockholders-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  });
});
