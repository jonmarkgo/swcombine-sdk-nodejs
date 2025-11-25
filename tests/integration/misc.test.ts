/**
 * Integration tests for Events, Location, Datacard, and Inventory resources
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SWCombine } from '../../src/index.js';
import { createTestClient, saveResponse, delay, hasAuthToken, TEST_CONFIG } from './setup.js';

describe('Events Resource Integration Tests', () => {
  let client: SWCombine;

  beforeAll(() => {
    client = createTestClient();
  });

  it('should list events', async () => {
    if (!hasAuthToken()) {
      console.log('⊘ Skipping Events: No auth token');
      return;
    }

    try {
      // Try to get character events
      const response = await client.events.list({
        eventMode: 'character',
        eventType: 'all',
      });

      console.log('Events List Response (count):', response.length);
      if (response.length > 0) {
        console.log('First event:', response[0]);
      }
      saveResponse('events-list', response);

      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBe(true);

      // Document events structure
      if (response.length > 0) {
        console.log(`\n📊 Events array structure:`);
        console.log(`   Total events: ${response.length}`);
        console.log(`   First event fields:`, Object.keys(response[0]).join(', '));
      }
    } catch (error: any) {
      console.log('Events List Error:', error.message, error.statusCode);
      saveResponse('events-list-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  });

  it('should get specific event', async () => {
    if (!hasAuthToken()) {
      console.log('⊘ Skipping Event Get: No auth token');
      return;
    }

    try {
      // First try to get events list
      const events = await client.events.list({
        eventMode: 'character',
        eventType: 'all',
      });

      if (events.length === 0) {
        console.log('⊘ Skipping: No events available');
        return;
      }

      const eventUid = events[0].uid;
      const response = await client.events.get({ uid: eventUid });

      console.log('Event Get Response:', response);
      saveResponse('event-get', response);

      expect(response).toBeDefined();

      // Document event structure
      console.log(`\n📊 Event fields:`, Object.keys(response).join(', '));
    } catch (error: any) {
      console.log('Event Get Error:', error.message, error.statusCode);
      saveResponse('event-get-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  });
});

describe('Location Resource Integration Tests', () => {
  let client: SWCombine;

  beforeAll(() => {
    client = createTestClient();
  });

  it('should get entity location', async () => {
    if (!hasAuthToken() || !TEST_CONFIG.characterUid) {
      console.log('⊘ Skipping Location: No auth token or character UID');
      return;
    }

    try {
      const response = await client.location.get({
        entityType: 'character',
        uid: TEST_CONFIG.characterUid,
      });

      console.log('Location Get Response:', response);
      saveResponse('location-character', response);

      expect(response).toBeDefined();

      // Document location structure
      console.log(`\n📊 Location fields:`, Object.keys(response).join(', '));
    } catch (error: any) {
      console.log('Location Get Error:', error.message, error.statusCode);
      saveResponse('location-get-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  }, 15000);
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

    try {
      const response = await client.datacard.list({ factionId: TEST_CONFIG.factionUid });

      console.log('Datacards List Response (count):', response.length);
      if (response.length > 0) {
        console.log('First datacard:', response[0]);
      }
      saveResponse('datacard-list', response);

      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBe(true);

      // Document datacards structure
      if (response.length > 0) {
        console.log(`\n📊 Datacards array structure:`);
        console.log(`   Total datacards: ${response.length}`);
        console.log(`   First datacard fields:`, Object.keys(response[0]).join(', '));
      }
    } catch (error: any) {
      console.log('Datacards List Error:', error.message, error.statusCode);
      saveResponse('datacard-list-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
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

    try {
      const response = await client.inventory.get({ uid: TEST_CONFIG.characterUid });

      console.log('Inventory Get Response:', response);
      saveResponse('inventory-get', response);

      expect(response).toBeDefined();

      // Document inventory structure
      console.log(`\n📊 Inventory fields:`, Object.keys(response).join(', '));
    } catch (error: any) {
      console.log('Inventory Get Error:', error.message, error.statusCode);
      saveResponse('inventory-get-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  });

  it('should list inventory entities', async () => {
    if (!hasAuthToken() || !TEST_CONFIG.characterUid) {
      console.log('⊘ Skipping Inventory Entities: No auth token or character UID');
      return;
    }

    try {
      // Try to get vehicles in inventory
      const response = await client.inventory.entities.list({
        uid: TEST_CONFIG.characterUid,
        entityType: 'vehicle',
        assignType: 'pilot',
      });

      console.log('Inventory Entities Response (count):', response.length);
      if (response.length > 0) {
        console.log('First entity:', response[0]);
      }
      saveResponse('inventory-entities-vehicles', response);

      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBe(true);

      // Document inventory entities structure
      if (response.length > 0) {
        console.log(`\n📊 Inventory entities array structure:`);
        console.log(`   Total entities: ${response.length}`);
        console.log(`   First entity fields:`, Object.keys(response[0]).join(', '));
      }
    } catch (error: any) {
      console.log('Inventory Entities Error:', error.message, error.statusCode);
      saveResponse('inventory-entities-error', { error: error.message, statusCode: error.statusCode });
    }

    await delay(100);
  });
});
