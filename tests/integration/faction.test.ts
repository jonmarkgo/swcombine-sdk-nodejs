/**
 * Integration tests for Faction resource
 * Tests all read-only Faction endpoints
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SWCombine } from '../../src/index.js';
import {
  createTestClient,
  saveResponse,
  TEST_CONFIG,
  hasAuthToken,
  expectArray,
  expectFields,
  expectUid,
} from './setup.js';

describe('Faction Resource Integration Tests', () => {
  let client: SWCombine;

  beforeAll(() => {
    client = createTestClient();
  });

  describe('Public endpoints', () => {
    it('should list all factions', async () => {
      const response = await client.faction.list();
      saveResponse('faction-list', response);

      expectArray(response, 1);
      // First faction should have uid and name
      const faction = (response as any[])[0];
      expectFields(faction, ['attributes']);
    });
  });

  describe('Authenticated faction endpoints', () => {
    it('should get specific faction by UID', async () => {
      if (!hasAuthToken() || !TEST_CONFIG.factionUid) {
        console.log('⊘ Skipping: No auth token or TEST_FACTION_UID');
        return;
      }

      const response = await client.faction.get({ uid: TEST_CONFIG.factionUid });
      saveResponse('faction-get', response);

      expectFields(response, ['uid', 'name']);
      expectUid(response.uid);
    });

    it('should list faction members', async () => {
      if (!hasAuthToken() || !TEST_CONFIG.factionUid) {
        console.log('⊘ Skipping: No auth token or TEST_FACTION_UID');
        return;
      }

      const response = await client.faction.members.list({ factionId: TEST_CONFIG.factionUid });
      saveResponse('faction-members', response);

      expectArray(response);
    });

    it('should list faction budgets', async () => {
      if (!hasAuthToken() || !TEST_CONFIG.factionUid) {
        console.log('⊘ Skipping: No auth token or TEST_FACTION_UID');
        return;
      }

      const response = await client.faction.budgets.list({ factionId: TEST_CONFIG.factionUid });
      saveResponse('faction-budgets', response);

      expectArray(response);
    });

    it('should list faction stockholders', async () => {
      if (!hasAuthToken() || !TEST_CONFIG.factionUid) {
        console.log('⊘ Skipping: No auth token or TEST_FACTION_UID');
        return;
      }

      const response = await client.faction.stockholders.list({ factionId: TEST_CONFIG.factionUid });
      saveResponse('faction-stockholders', response);

      expectArray(response);
    });

    it('should get faction credits', async () => {
      if (!hasAuthToken() || !TEST_CONFIG.factionUid) {
        console.log('⊘ Skipping: No auth token or TEST_FACTION_UID');
        return;
      }

      const response = await client.faction.credits.get({ factionId: TEST_CONFIG.factionUid });
      saveResponse('faction-credits', response);

      expect(response).toBeDefined();
      expectFields(response, ['credits']);
    });

    it('should list faction credit log', async () => {
      if (!hasAuthToken() || !TEST_CONFIG.factionUid) {
        console.log('⊘ Skipping: No auth token or TEST_FACTION_UID');
        return;
      }

      const response = await client.faction.creditlog.list({ factionId: TEST_CONFIG.factionUid });
      saveResponse('faction-creditlog', response);

      expectArray(response);
    });
  });
});
