import { describe, expect, it } from 'vitest';
import { SWCombine, SWCError } from '../../src/index.js';

describe('SWCombine auth modes', () => {
  it('creates a public client with no config', () => {
    const client = new SWCombine();
    expect(client).toBeInstanceOf(SWCombine);
  });

  it('throws when only clientId is provided', () => {
    expect(() => new SWCombine({ clientId: 'client-id' })).toThrow(SWCError);
    expect(() => new SWCombine({ clientId: 'client-id' })).toThrow(
      'Provide both clientId and clientSecret together, or neither.'
    );
  });

  it('throws when only clientSecret is provided', () => {
    expect(() => new SWCombine({ clientSecret: 'client-secret' })).toThrow(SWCError);
    expect(() => new SWCombine({ clientSecret: 'client-secret' })).toThrow(
      'Provide both clientId and clientSecret together, or neither.'
    );
  });

  it('throws SWCError when token-only client calls OAuth authorization URL', () => {
    const client = new SWCombine({ token: 'access-token' });

    expect(() =>
      client.auth.getAuthorizationUrl({
        scopes: ['character_read'],
        state: 'test-state',
      })
    ).toThrow(SWCError);

    expect(() =>
      client.auth.getAuthorizationUrl({
        scopes: ['character_read'],
        state: 'test-state',
      })
    ).toThrow('Initialize SWCombine with both clientId and clientSecret.');
  });

  it('throws SWCError when token-only client calls refreshToken()', async () => {
    const client = new SWCombine({ token: 'access-token' });

    await expect(client.refreshToken()).rejects.toBeInstanceOf(SWCError);
    await expect(client.refreshToken()).rejects.toMatchObject({ type: 'auth' });
    await expect(client.refreshToken()).rejects.toThrow(
      'Initialize SWCombine with both clientId and clientSecret.'
    );
  });

  it('throws SWCError when token-only client calls auth.handleCallback()', async () => {
    const client = new SWCombine({ token: 'access-token' });

    await expect(
      client.auth.handleCallback({ code: 'abc123', state: 'test-state' })
    ).rejects.toBeInstanceOf(SWCError);
    await expect(
      client.auth.handleCallback({ code: 'abc123', state: 'test-state' })
    ).rejects.toMatchObject({
      type: 'auth',
    });
  });

  it('throws SWCError when token-only client calls auth.revokeToken()', async () => {
    const client = new SWCombine({ token: 'access-token' });

    await expect(client.auth.revokeToken('refresh-token')).rejects.toBeInstanceOf(SWCError);
    await expect(client.auth.revokeToken('refresh-token')).rejects.toMatchObject({ type: 'auth' });
  });

  it('throws SWCError when full OAuth client has no refresh token', async () => {
    const client = new SWCombine({
      clientId: 'client-id',
      clientSecret: 'client-secret',
      token: { accessToken: 'access-token', expiresAt: Date.now() + 3600 * 1000 },
    });

    await expect(client.refreshToken()).rejects.toBeInstanceOf(SWCError);
    await expect(client.refreshToken()).rejects.toMatchObject({ type: 'auth' });
    await expect(client.refreshToken()).rejects.toThrow('no refresh token is available');
  });
});
