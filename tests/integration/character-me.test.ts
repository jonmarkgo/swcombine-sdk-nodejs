/**
 * Integration test for character.me() endpoint
 * Tests the authenticated user's character info
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SWCombine } from '../../src/index.js';
import {
  createTestClient,
  saveResponse,
  hasAuthToken,
  expectFields,
  expectUid,
} from './setup.js';

describe('Character Me Integration Test', () => {
  let client: SWCombine;

  beforeAll(() => {
    client = createTestClient();
  });

  it('should get the currently authenticated character', async () => {
    if (!hasAuthToken()) {
      console.log('⊘ Skipping: No auth token');
      return;
    }

    const character = await client.character.me();
    saveResponse('character-me', character);

    expectFields(character, ['uid', 'name']);
    expectUid(character.uid);

    console.log(`✓ Authenticated as: ${character.name} (${character.uid})`);
  });
});
