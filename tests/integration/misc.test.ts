/**
 * Integration tests for Events, Location, Datacard, and Inventory resources
 * Tests all read-only endpoints for these resources
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SWCombine } from '../../src/index.js';
import {
  createTestClient,
  saveResponse,
  hasAuthToken,
  TEST_CONFIG,
  expectFields,
} from './setup.js';

function expectPageShape(response: unknown): void {
  expect(response).toBeDefined();
  expect(typeof response).toBe('object');
  expect(response).not.toBeNull();
  expectFields(response, ['data', 'total', 'start', 'count', 'hasMore']);
}

describe('Events Resource Integration Tests', () => {
  let client: SWCombine;

  beforeAll(() => {
    client = createTestClient();
  });

  it('should list personal events', async () => {
    if (!hasAuthToken()) {
      console.log('⊘ Skipping Events: No auth token');
      return;
    }

    const response = await client.events.list({ eventMode: 'personal' });
    saveResponse('events-list', response);

    expectPageShape(response);
  });

  it('should list events with pagination', async () => {
    if (!hasAuthToken()) {
      console.log('⊘ Skipping Events: No auth token');
      return;
    }

    const response = await client.events.list({
      eventMode: 'personal',
      start_index: 0,
      item_count: 10,
    });
    saveResponse('events-list-paginated', response);

    expectPageShape(response);
    expect(response.data.length).toBeLessThanOrEqual(10);
  });

  it('should get specific event if available', async () => {
    if (!hasAuthToken()) {
      console.log('⊘ Skipping Event Get: No auth token');
      return;
    }

    const events = await client.events.list({ eventMode: 'personal' });
    if (events.data.length === 0) {
      console.log('⊘ Skipping: No events available');
      return;
    }

    const eventUid = (events.data[0] as any).uid || (events.data[0] as any).attributes?.uid;
    if (!eventUid) {
      console.log('⊘ Skipping: No event UID found');
      return;
    }

    const response = await client.events.get({ uid: eventUid });
    saveResponse('event-get', response);

    expectFields(response, ['uid']);
  });
});

describe('Location Resource Integration Tests', () => {
  let client: SWCombine;

  beforeAll(() => {
    client = createTestClient();
  });

  it('should get character location', async () => {
    if (!hasAuthToken() || !TEST_CONFIG.characterUid) {
      console.log('⊘ Skipping Location: No auth token or character UID');
      return;
    }

    // API expects plural entity types (e.g., 'characters' not 'character')
    const response = await client.location.get({
      entityType: 'characters',
      uid: TEST_CONFIG.characterUid,
    });
    saveResponse('location-character', response);

    expect(response).toBeDefined();
    expect(typeof response).toBe('object');
  });
});

describe('Datacard Resource Integration Tests', () => {
  let client: SWCombine;

  beforeAll(() => {
    client = createTestClient();
  });

  it('should list datacards for faction', async () => {
    if (!hasAuthToken() || !TEST_CONFIG.factionUid) {
      console.log('⊘ Skipping Datacards: No auth token or faction UID');
      return;
    }

    const response = await client.datacard.list({ factionId: TEST_CONFIG.factionUid });
    saveResponse('datacard-list', response);

    expectPageShape(response);
  });

  it('should get specific datacard if available', async () => {
    if (!hasAuthToken() || !TEST_CONFIG.factionUid) {
      console.log('⊘ Skipping Datacard Get: No auth token or faction UID');
      return;
    }

    const datacards = await client.datacard.list({ factionId: TEST_CONFIG.factionUid });
    if (datacards.data.length === 0) {
      console.log('⊘ Skipping: No datacards available');
      return;
    }

    const datacardUid = (datacards.data[0] as any).uid || (datacards.data[0] as any).attributes?.uid;
    if (!datacardUid) {
      console.log('⊘ Skipping: No datacard UID found');
      return;
    }

    const response = await client.datacard.get({ uid: datacardUid });
    saveResponse('datacard-get', response);

    expectFields(response, ['uid']);
  });
});

describe('Inventory Resource Integration Tests', () => {
  let client: SWCombine;

  beforeAll(() => {
    client = createTestClient();
  });

  it('should get inventory', async () => {
    if (!hasAuthToken() || !TEST_CONFIG.characterUid) {
      console.log('⊘ Skipping Inventory: No auth token or character UID');
      return;
    }

    const response = await client.inventory.get({ uid: TEST_CONFIG.characterUid });
    saveResponse('inventory-get', response);

    expect(response).toBeDefined();
    expect(typeof response).toBe('object');
  });

  it('should list inventory entities (vehicles)', async () => {
    if (!hasAuthToken() || !TEST_CONFIG.characterUid) {
      console.log('⊘ Skipping Inventory Entities: No auth token or character UID');
      return;
    }

    const response = await client.inventory.entities.list({
      uid: TEST_CONFIG.characterUid,
      entityType: 'vehicles',
      assignType: 'pilot',
    });
    saveResponse('inventory-entities-vehicles', response);

    expectPageShape(response);
  });

  it('should list inventory entities (ships)', async () => {
    if (!hasAuthToken() || !TEST_CONFIG.characterUid) {
      console.log('⊘ Skipping Inventory Entities: No auth token or character UID');
      return;
    }

    const response = await client.inventory.entities.list({
      uid: TEST_CONFIG.characterUid,
      entityType: 'ships',
      assignType: 'owner',
    });
    saveResponse('inventory-entities-ships', response);

    expectPageShape(response);
  });

  it('should list inventory entities with pagination', async () => {
    if (!hasAuthToken() || !TEST_CONFIG.characterUid) {
      console.log('⊘ Skipping Inventory Entities: No auth token or character UID');
      return;
    }

    const response = await client.inventory.entities.list({
      uid: TEST_CONFIG.characterUid,
      entityType: 'ships',
      assignType: 'owner',
      start_index: 1,
      item_count: 10,
    });
    saveResponse('inventory-entities-ships-paginated', response);

    expectPageShape(response);
    expect(response.data.length).toBeLessThanOrEqual(10);
  });
});
