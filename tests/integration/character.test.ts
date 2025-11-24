/**
 * Integration tests for Character resource
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SWCombine } from '../../src/index.js';
import { createTestClient, saveResponse, delay, hasAuthToken, TEST_CONFIG } from './setup.js';
import { validateCharacter, validateArray } from './validators.js';

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

    const response = await client.character.get({ uid: TEST_CONFIG.characterUid });

    console.log('Character Get Response:', response);
    saveResponse('character-get', response);

    expect(response).toBeDefined();
    expect(response.uid).toBe(TEST_CONFIG.characterUid);

    // Validate type structure
    validateCharacter(response);

    await delay(100);
  });

  it('should get character skills', async () => {
    if (!hasAuthToken() || !TEST_CONFIG.characterUid) {
      console.log('⊘ Skipping: No auth token or TEST_CHARACTER_UID');
      return;
    }

    const response = await client.character.skills.list({ uid: TEST_CONFIG.characterUid });

    console.log('Character Skills Response:', JSON.stringify(response, null, 2).substring(0, 500));
    saveResponse('character-skills', response);

    expect(response).toBeDefined();
    expect(typeof response).toBe('object');

    // Document skills structure
    console.log(`\n📊 Skills response structure:`);
    console.log(`   Top-level fields:`, Object.keys(response).join(', '));

    await delay(100);
  });

  it('should get character privileges', async () => {
    if (!hasAuthToken() || !TEST_CONFIG.characterUid) {
      console.log('⊘ Skipping: No auth token or TEST_CHARACTER_UID');
      return;
    }

    const response = await client.character.privileges.list({ uid: TEST_CONFIG.characterUid });

    console.log('Character Privileges Response:', JSON.stringify(response, null, 2).substring(0, 500));
    saveResponse('character-privileges', response);

    expect(response).toBeDefined();
    expect(typeof response).toBe('object');

    // Document privileges structure
    console.log(`\n📊 Privileges response structure:`);
    console.log(`   Top-level fields:`, Object.keys(response).join(', '));

    await delay(100);
  });

  it('should get character credits', async () => {
    if (!hasAuthToken() || !TEST_CONFIG.characterUid) {
      console.log('⊘ Skipping: No auth token or TEST_CHARACTER_UID');
      return;
    }

    const response = await client.character.credits.get({ uid: TEST_CONFIG.characterUid });

    console.log('Character Credits Response:', response);
    saveResponse('character-credits', response);

    expect(response).toBeDefined();

    await delay(100);
  });

  it('should list character messages', async () => {
    if (!hasAuthToken() || !TEST_CONFIG.characterUid) {
      console.log('⊘ Skipping: No auth token or TEST_CHARACTER_UID');
      return;
    }

    const response = await client.character.messages.list({
      uid: TEST_CONFIG.characterUid,
      mode: 'received',
    });

    console.log('Character Messages Response:', JSON.stringify(response, null, 2).substring(0, 500));
    saveResponse('character-messages', response);

    expect(response).toBeDefined();
    expect(typeof response).toBe('object');

    // Check if it has pagination metadata and message array
    if ('attributes' in response && 'message' in response) {
      const messagesData = response as any;
      console.log(`\n📊 Messages response structure:`);
      console.log(`   Total messages: ${messagesData.attributes.total}`);
      console.log(`   Messages in this page: ${messagesData.attributes.count}`);
      expect(Array.isArray(messagesData.message)).toBe(true);
    }

    await delay(100);
  });

  it('should get character permissions', async () => {
    if (!hasAuthToken() || !TEST_CONFIG.characterUid) {
      console.log('⊘ Skipping: No auth token or TEST_CHARACTER_UID');
      return;
    }

    const response = await client.character.permissions.list({ uid: TEST_CONFIG.characterUid });

    console.log('Character Permissions Response:', JSON.stringify(response, null, 2).substring(0, 500));
    saveResponse('character-permissions', response);

    expect(response).toBeDefined();
    expect(typeof response).toBe('object');

    // Document permissions structure
    console.log(`\n📊 Permissions response structure:`);
    console.log(`   Top-level fields:`, Object.keys(response).join(', '));

    await delay(100);
  });
});
