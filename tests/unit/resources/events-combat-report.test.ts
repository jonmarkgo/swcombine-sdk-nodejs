import { describe, it, expect } from 'vitest';
import { EventsResource } from '../../../src/resources/EventsResource.js';
import { createMockHttpClient } from '../helpers/mock-http.js';
import type { HttpClient } from '../../../src/http/HttpClient.js';

describe('EventsResource combat reports', () => {
  function createResource() {
    const mockHttp = createMockHttpClient();
    const resource = new EventsResource(mockHttp as unknown as HttpClient);
    return { resource, mockHttp };
  }

  it('getCombatReport() GETs /events/combat/report/{id}', async () => {
    const { resource, mockHttp } = createResource();
    const report = { version: 1, title: 'Ground Combat', combat: 'ground' };
    mockHttp.get.mockResolvedValue(report);

    expect(await resource.getCombatReport({ reportId: 1001 })).toEqual(report);
    expect(mockHttp.get).toHaveBeenCalledWith('/events/combat/report/1001');
  });

  it('getFactionCombatReport() GETs /events/faction/report/{id}', async () => {
    const { resource, mockHttp } = createResource();
    const report = { version: 1, title: 'Deep Space Combat', combat: 'space' };
    mockHttp.get.mockResolvedValue(report);

    expect(await resource.getFactionCombatReport({ reportId: 1001 })).toEqual(report);
    expect(mockHttp.get).toHaveBeenCalledWith('/events/faction/report/1001');
  });
});
