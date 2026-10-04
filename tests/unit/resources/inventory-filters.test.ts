import { describe, it, expect } from 'vitest';
import { InventoryResource } from '../../../src/resources/InventoryResource.js';
import { SWCError } from '../../../src/http/errors.js';
import { createMockHttpClient } from '../helpers/mock-http.js';
import type { HttpClient } from '../../../src/http/HttpClient.js';
import type { ListInventoryEntitiesOptions } from '../../../src/types/index.js';

function setup() {
  const http = createMockHttpClient();
  const empty = { entities: { attributes: { start: 1, total: 0, count: 0 }, entity: [] } };
  http.get.mockResolvedValue(empty);
  http.post.mockResolvedValue(empty);
  const inventory = new InventoryResource(http as unknown as HttpClient);
  const list = (opts: Partial<ListInventoryEntitiesOptions>) =>
    inventory.entities.list({
      uid: '1:1',
      entityType: 'ships',
      assignType: 'owner',
      ...opts,
    } as ListInventoryEntitiesOptions);
  const sentParams = () => http.get.mock.calls[0][1].params;
  // `filters` travel as a JSON array in the POST body.
  const sentFilters = (call = 0) => JSON.parse(http.post.mock.calls[call][1].filters);
  return { http, list, sentParams, sentFilters };
}

describe('inventory.entities.list() filters', () => {
  it('sends filters as a JSON array in a POST body, with pagination in the query', async () => {
    const { http, list, sentFilters } = setup();
    await list({
      filters: [
        { type: 'type', value: ['2:7', '2:19'] },
        { type: 'protected', value: true, inclusion: 'excludes' },
      ],
    });

    expect(http.get).not.toHaveBeenCalled();
    expect(http.post.mock.calls[0][0]).toBe('/inventory/1:1/ships/owner');
    expect(sentFilters()).toEqual([
      { type: 'type', value: ['2:7', '2:19'], inclusion: 'includes' },
      { type: 'protected', value: ['1'], inclusion: 'excludes' },
    ]);
    expect(http.post.mock.calls[0][2]).toEqual({ params: { start_index: 1, item_count: 50 } });
  });

  it('translates None: 0:0 for container (the only form the API honours), empty string otherwise', async () => {
    const { list, sentFilters } = setup();
    await list({
      filters: [
        { type: 'container', value: null },
        { type: 'city', value: null },
        { type: 'infotext', value: '' },
      ],
    });
    expect(sentFilters()).toEqual([
      { type: 'container', value: ['0:0'], inclusion: 'includes' },
      { type: 'city', value: [''], inclusion: 'includes' },
      { type: 'infotext', value: [''], inclusion: 'includes' },
    ]);
  });

  it('sends booleans as 1/0 and numbers as strings', async () => {
    const { list, sentFilters } = setup();
    await list({
      filters: [
        { type: 'underconstruction', value: false },
        { type: 'opento', value: [0, 2] },
      ],
    });
    expect(sentFilters()).toEqual([
      { type: 'underconstruction', value: ['0'], inclusion: 'includes' },
      { type: 'opento', value: ['0', '2'], inclusion: 'includes' },
    ]);
  });

  it('keeps filters when fetching the next page', async () => {
    const { http, list, sentFilters } = setup();
    http.post.mockResolvedValue({
      entities: { attributes: { start: 1, total: 4, count: 2 }, entity: [{}, {}] },
    });
    const page = await list({ item_count: 2, filters: [{ type: 'type', value: ['2:7', '2:19'] }] });
    await page.getNextPage();

    expect(sentFilters(1)).toEqual([
      { type: 'type', value: ['2:7', '2:19'], inclusion: 'includes' },
    ]);
    expect(http.post.mock.calls[1][2]).toEqual({ params: { start_index: 3, item_count: 2 } });
  });

  it('lists without filters as a plain GET', async () => {
    const { http, list, sentParams } = setup();
    await list({ filters: [] });
    expect(http.post).not.toHaveBeenCalled();
    expect(sentParams()).toEqual({ start_index: 1, item_count: 50 });
  });

  it('defaults legacy filter_inclusion to includes (the API 400s without it)', async () => {
    const { list, sentParams } = setup();
    await list({
      filter_type: ['type', 'name'],
      filter_value: ['2:7', 'Rebel Dawn'],
      filter_inclusion: ['excludes'],
    });
    expect(sentParams()).toMatchObject({
      filter_type: ['type', 'name'],
      filter_value: ['2:7', 'Rebel Dawn'],
      filter_inclusion: ['excludes', 'includes'],
    });
  });

  it.each([
    [
      'a filter that does not apply to the entity type',
      { filters: [{ type: 'powered', value: true }] },
    ],
    [
      'a type that only excludes this entity type',
      { entityType: 'cities', filters: [{ type: 'type', value: '7:1' }] },
    ],
    [
      'the same type twice',
      {
        filters: [
          { type: 'type', value: '2:7' },
          { type: 'type', value: '2:19' },
        ],
      },
    ],
    [
      'filters mixed with legacy arrays',
      { filters: [{ type: 'type', value: '2:7' }], filter_type: ['name'], filter_value: ['x'] },
    ],
    [
      'legacy arrays of different lengths',
      { filter_type: ['type', 'name'], filter_value: ['2:7'] },
    ],
    [
      'a legacy filter that does not apply',
      { entityType: 'planets', filter_type: ['protected'], filter_value: ['1'] },
    ],
    // The API reads a non-numeric UID filter value as ID 0 ("None"): for pilot that silently
    // returns the entities with no pilot.
    ['a name where a UID is needed', { filters: [{ type: 'pilot', value: 'Dreks Selmur' }] }],
    ['a name in a legacy UID filter', { filter_type: ['class'], filter_value: ['Fighter'] }],
  ])('rejects %s before sending a request', async (_label, opts) => {
    const { http, list } = setup();
    await expect(list(opts as Partial<ListInventoryEntitiesOptions>)).rejects.toSatisfy(
      (e) => e instanceof SWCError && e.type === 'validation'
    );
    expect(http.get).not.toHaveBeenCalled();
    expect(http.post).not.toHaveBeenCalled();
  });

  it('allows filters that apply to the entity type', async () => {
    const { list } = setup();
    await expect(
      list({
        entityType: 'npcs',
        filters: [
          { type: 'race', value: '22:18' },
          { type: 'gender', value: 'F' },
        ],
      })
    ).resolves.toBeDefined();
    await expect(
      list({ entityType: 'facilities', filters: [{ type: 'powered', value: true }] })
    ).resolves.toBeDefined();
    // UIDs, bare numeric IDs and numbers are all fine.
    await expect(
      list({ filters: [{ type: 'pilot', value: ['1:46931', '46931', 3] }] })
    ).resolves.toBeDefined();
  });
});
