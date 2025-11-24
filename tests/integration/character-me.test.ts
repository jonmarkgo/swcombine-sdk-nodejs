/**
 * Integration test for character.me() endpoint
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SWCombine } from '../../src/index.js';
import { createTestClient, saveResponse, hasAuthToken } from './setup.js';
import { validateCharacter } from './validators.js';

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

    console.log('Current Character:', {
      uid: character.uid,
      name: character.name,
      handle: (character as any).handle,
    });

    saveResponse('character-me', character);

    expect(character).toBeDefined();
    expect(character.uid).toBeDefined();
    expect(character.name).toBeDefined();

    // Validate type structure
    validateCharacter(character);

    console.log(`✓ Authenticated as: ${character.name} (${character.uid})`);
  });
});
