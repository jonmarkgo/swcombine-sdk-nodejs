/**
 * Integration tests for Character resource
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SWCombine } from '../../src/index.js';
import { createTestClient, saveResponse, delay, hasAuthToken, TEST_CONFIG } from './setup.js';

describe('Character Resource Integration Tests', () => {
  let client: SWCombine;

  beforeAll(() => {
    client = createTestClient();
  });

  it('should get character by handle check', async () => {
    if (!TEST_CONFIG.characterHandle) {
      console.log('⊘ Skipping: No TEST_CHARACTER_HANDLE provided');
      return;
    }

    try {
      const response = await client.character.getByHandle({
        handle: TEST_CONFIG.characterHandle,
      });

      console.log('Character HandleCheck Response:', response);
      saveResponse('character-handlecheck', response);

      expect(response).toBeDefined();
      expect(response.uid).toBeDefined();
    } catch (error: any) {
      console.log('HandleCheck Error:', error.message, error.statusCode);
      saveResponse('character-handlecheck-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  });

  it('should get character by UID', async () => {
    if (!hasAuthToken() || !TEST_CONFIG.characterUid) {
      console.log('⊘ Skipping: No auth token or TEST_CHARACTER_UID');
      return;
    }

    try {
      const response = await client.character.get({ uid: TEST_CONFIG.characterUid });

      console.log('Character Get Response:', response);
      saveResponse('character-get', response);

      expect(response).toBeDefined();
      expect(response.uid).toBe(TEST_CONFIG.characterUid);
    } catch (error: any) {
      console.log('Character Get Error:', error.message, error.statusCode);
      saveResponse('character-get-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  });

  it('should get character skills', async () => {
    if (!hasAuthToken() || !TEST_CONFIG.characterUid) {
      console.log('⊘ Skipping: No auth token or TEST_CHARACTER_UID');
      return;
    }

    try {
      const response = await client.character.skills.list({ uid: TEST_CONFIG.characterUid });

      console.log('Character Skills Response (first 3):', response.slice(0, 3));
      saveResponse('character-skills', response);

      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBe(true);
    } catch (error: any) {
      console.log('Character Skills Error:', error.message, error.statusCode);
      saveResponse('character-skills-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  });

  it('should get character privileges', async () => {
    if (!hasAuthToken() || !TEST_CONFIG.characterUid) {
      console.log('⊘ Skipping: No auth token or TEST_CHARACTER_UID');
      return;
    }

    try {
      const response = await client.character.privileges.list({ uid: TEST_CONFIG.characterUid });

      console.log('Character Privileges Response (first 3):', response.slice(0, 3));
      saveResponse('character-privileges', response);

      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBe(true);
    } catch (error: any) {
      console.log('Character Privileges Error:', error.message, error.statusCode);
      saveResponse('character-privileges-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  });

  it('should get character credits', async () => {
    if (!hasAuthToken() || !TEST_CONFIG.characterUid) {
      console.log('⊘ Skipping: No auth token or TEST_CHARACTER_UID');
      return;
    }

    try {
      const response = await client.character.credits.get({ uid: TEST_CONFIG.characterUid });

      console.log('Character Credits Response:', response);
      saveResponse('character-credits', response);

      expect(response).toBeDefined();
    } catch (error: any) {
      console.log('Character Credits Error:', error.message, error.statusCode);
      saveResponse('character-credits-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  });

  it('should list character messages', async () => {
    if (!hasAuthToken() || !TEST_CONFIG.characterUid) {
      console.log('⊘ Skipping: No auth token or TEST_CHARACTER_UID');
      return;
    }

    try {
      const response = await client.character.messages.list({
        uid: TEST_CONFIG.characterUid,
        mode: 'received',
      });

      console.log('Character Messages Response (count):', response.length);
      saveResponse('character-messages', response);

      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBe(true);
    } catch (error: any) {
      console.log('Character Messages Error:', error.message, error.statusCode);
      saveResponse('character-messages-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  });

  it('should get character permissions', async () => {
    if (!hasAuthToken() || !TEST_CONFIG.characterUid) {
      console.log('⊘ Skipping: No auth token or TEST_CHARACTER_UID');
      return;
    }

    try {
      const response = await client.character.permissions.list({ uid: TEST_CONFIG.characterUid });

      console.log('Character Permissions Response:', response);
      saveResponse('character-permissions', response);

      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBe(true);
    } catch (error: any) {
      console.log('Character Permissions Error:', error.message, error.statusCode);
      saveResponse('character-permissions-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  });
});
