import { describe, it, expect } from 'vitest';
import { CharacterResource } from '../../../src/resources/CharacterResource.js';
import { SWCError } from '../../../src/http/errors.js';
import { createMockHttpClient } from '../helpers/mock-http.js';
import type { HttpClient } from '../../../src/http/HttpClient.js';

function setup(response: unknown) {
  const http = createMockHttpClient();
  http.post.mockResolvedValue(response);
  const { privileges } = new CharacterResource(http as unknown as HttpClient);
  const update = () =>
    privileges.update({ uid: '1:1001', privilegeGroup: 'members', privilege: 'set_infofields' });
  return { update };
}

describe('character.privileges.update()', () => {
  it('throws the API reason when the change is refused with a 200 failure list', async () => {
    const reason = 'Cannot change privileges: Requires powered HQ to change privileges.';
    const { update } = setup({ failure: [reason] });

    const error = await update().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(SWCError);
    expect(error).toMatchObject({ message: reason, type: 'validation', retryable: false });
  });

  it('resolves with the API response when the change is applied', async () => {
    // The 201 body is not documented; anything without a failure list passes through.
    const applied = { attributes: { uid: 'set_infofields' }, value: 'true' };
    const { update } = setup(applied);

    await expect(update()).resolves.toEqual(applied);
  });
});
