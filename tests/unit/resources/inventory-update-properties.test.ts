import { describe, it, expect } from 'vitest';
import { InventoryResource } from '../../../src/resources/InventoryResource.js';
import { createMockHttpClient } from '../helpers/mock-http.js';
import type { HttpClient } from '../../../src/http/HttpClient.js';

const result = {
  status: {},
  data: {
    succeeded: { entity: [{ uid: '2:1002' }, { uid: '3:2001' }] },
    failed: { entity: [] },
  },
};

function setup() {
  const http = createMockHttpClient();
  http.post.mockResolvedValue(result);
  const { entities } = new InventoryResource(http as unknown as HttpClient);
  return { http, entities };
}

const uidList = (count: number) => Array.from({ length: count }, (_, i) => `2:${i + 1}`);

describe('inventory.entities.updateProperties()', () => {
  it('posts the uids and new value to the batch property endpoint', async () => {
    const { http, entities } = setup();
    const response = await entities.updateProperties({
      property: 'commander',
      uids: ['2:1002', '3:2001'],
      new_value: 'Dax Orin',
    });
    expect(http.post).toHaveBeenCalledWith('/inventory/entities/commander/', {
      uids: ['2:1002', '3:2001'],
      new_value: 'Dax Orin',
    });
    expect(response).toEqual(result);
  });

  it('sends the reason when given', async () => {
    const { http, entities } = setup();
    await entities.updateProperties({
      property: 'owner',
      uids: ['2:1002'],
      new_value: 'Dax Orin',
      reason: 'Fleet transfer',
    });
    expect(http.post).toHaveBeenCalledWith('/inventory/entities/owner/', {
      uids: ['2:1002'],
      new_value: 'Dax Orin',
      reason: 'Fleet transfer',
    });
  });

  it('rejects an empty uid list before any request', async () => {
    const { http, entities } = setup();
    await expect(
      entities.updateProperties({ property: 'name', uids: [], new_value: 'Rebel Dawn' })
    ).rejects.toMatchObject({ type: 'validation' });
    expect(http.post).not.toHaveBeenCalled();
  });

  it('rejects more than 100 uids before any request', async () => {
    const { http, entities } = setup();
    await expect(
      entities.updateProperties({ property: 'name', uids: uidList(101), new_value: 'Rebel Dawn' })
    ).rejects.toMatchObject({ type: 'validation' });
    expect(http.post).not.toHaveBeenCalled();
  });

  it('accepts exactly 100 uids', async () => {
    const { http, entities } = setup();
    await entities.updateProperties({
      property: 'name',
      uids: uidList(100),
      new_value: 'Rebel Dawn',
    });
    expect(http.post).toHaveBeenCalledTimes(1);
  });
});
