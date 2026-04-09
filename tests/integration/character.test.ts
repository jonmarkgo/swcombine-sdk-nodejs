/**
 * Integration tests for Character resource
 * Tests all read-only Character endpoints
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SWCombine, MessageMode } from '../../src/index.js';
import {
  createTestClient,
  saveResponse,
  hasAuthToken,
  TEST_CONFIG,
  expectFields,
  expectUid,
} from './setup.js';

function expectPageShape(response: unknown): void {
  expect(response).toBeDefined();
  expect(typeof response).toBe('object');
  expect(response).not.toBeNull();
  expectFields(response, ['data', 'total', 'start', 'count', 'hasMore']);
}

describe('Character Resource Integration Tests', () => {
  let client: SWCombine;

  beforeAll(() => {
    client = createTestClient();
  });

  describe('Public endpoints (no auth required)', () => {
    it('should get character UID by handle', async () => {
      if (!TEST_CONFIG.characterHandle) {
        console.log('⊘ Skipping: No TEST_CHARACTER_HANDLE provided');
        return;
      }

      const response = await client.character.getByHandle({
        handle: TEST_CONFIG.characterHandle,
      });
      saveResponse('character-handlecheck', response);

      expectFields(response, ['uid', 'handle']);
      expectUid(response.uid);
      expect(response.handle).toBe(TEST_CONFIG.characterHandle);
    });
  });

  describe('Authenticated endpoints', () => {
    it('should get character by UID', async () => {
      if (!hasAuthToken() || !TEST_CONFIG.characterUid) {
        console.log('⊘ Skipping: No auth token or TEST_CHARACTER_UID');
        return;
      }

      const response = await client.character.get({ uid: TEST_CONFIG.characterUid });
      saveResponse('character-get', response);

      expectFields(response, ['uid', 'name']);
      expectUid(response.uid);
    });

    it('should get character skills', async () => {
      if (!hasAuthToken() || !TEST_CONFIG.characterUid) {
        console.log('⊘ Skipping: No auth token or TEST_CHARACTER_UID');
        return;
      }

      const response = await client.character.skills.list({ uid: TEST_CONFIG.characterUid });
      saveResponse('character-skills', response);

      expect(response).toBeDefined();
      expect(typeof response).toBe('object');
      // Skills endpoint returns an object with skill categories
    });

    it('should get character privileges', async () => {
      if (!hasAuthToken() || !TEST_CONFIG.characterUid) {
        console.log('⊘ Skipping: No auth token or TEST_CHARACTER_UID');
        return;
      }

      const response = await client.character.privileges.list({ uid: TEST_CONFIG.characterUid });
      saveResponse('character-privileges', response);

      expect(response).toBeDefined();
      expect(typeof response).toBe('object');
    });

    it('should get character credits', async () => {
      if (!hasAuthToken() || !TEST_CONFIG.characterUid) {
        console.log('⊘ Skipping: No auth token or TEST_CHARACTER_UID');
        return;
      }

      const response = await client.character.credits.get({ uid: TEST_CONFIG.characterUid });
      saveResponse('character-credits', response);

      expect(response).toBeDefined();
      // Credits response is a number (the credit amount directly)
      expect(typeof response).toBe('number');
      expect(response).toBeGreaterThanOrEqual(0);
    });

    it('should get character credit log', async () => {
      if (!hasAuthToken() || !TEST_CONFIG.characterUid) {
        console.log('⊘ Skipping: No auth token or TEST_CHARACTER_UID');
        return;
      }

      const response = await client.character.creditlog.list({ uid: TEST_CONFIG.characterUid });
      saveResponse('character-creditlog', response);

      expectPageShape(response);
      // Credit log is a page of transactions
    });

    it('should list character messages (received)', async () => {
      if (!hasAuthToken() || !TEST_CONFIG.characterUid) {
        console.log('⊘ Skipping: No auth token or TEST_CHARACTER_UID');
        return;
      }

      const response = await client.character.messages.list({
        uid: TEST_CONFIG.characterUid,
        mode: MessageMode.Received,
      });
      saveResponse('character-messages-received', response);

      expectPageShape(response);
    });

    it('should list character messages (sent)', async () => {
      if (!hasAuthToken() || !TEST_CONFIG.characterUid) {
        console.log('⊘ Skipping: No auth token or TEST_CHARACTER_UID');
        return;
      }

      const response = await client.character.messages.list({
        uid: TEST_CONFIG.characterUid,
        mode: MessageMode.Sent,
      });
      saveResponse('character-messages-sent', response);

      expectPageShape(response);
    });

    it('should get character permissions', async () => {
      if (!hasAuthToken() || !TEST_CONFIG.characterUid) {
        console.log('⊘ Skipping: No auth token or TEST_CHARACTER_UID');
        return;
      }

      const response = await client.character.permissions.list({ uid: TEST_CONFIG.characterUid });
      saveResponse('character-permissions', response);

      expect(response).toBeDefined();
      expect(typeof response).toBe('object');
    });
  });
});
