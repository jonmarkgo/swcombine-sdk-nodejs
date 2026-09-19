import { createHash } from 'node:crypto';
import axios from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { OAuthClient, createPkcePair } from '../../src/auth/OAuthClient.js';

vi.mock('axios');

describe('OAuth PKCE', () => {
  const client = new OAuthClient({
    clientId: 'id',
    clientSecret: 'secret',
    redirectUri: 'http://localhost/callback',
  });

  it('creates an S256 verifier/challenge pair', () => {
    const { codeVerifier, codeChallenge } = createPkcePair();
    expect(codeVerifier).toMatch(/^[A-Za-z0-9_-]{43,128}$/);
    expect(codeChallenge).toBe(createHash('sha256').update(codeVerifier).digest('base64url'));
  });

  it('adds code_challenge to the authorization URL only when given', () => {
    const plain = new URL(client.getAuthorizationUrl({ scopes: ['character_read'], state: 's' }));
    expect(plain.searchParams.has('code_challenge')).toBe(false);

    const url = new URL(
      client.getAuthorizationUrl({ scopes: ['character_read'], state: 's', codeChallenge: 'abc' })
    );
    expect(url.searchParams.get('code_challenge')).toBe('abc');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
  });

  it('sends code_verifier on token exchange', async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { access_token: 't', expires_in: 3600 } });

    const result = await client.handleCallback({ code: 'c', state: 's' }, 'verifier');

    expect(result.success).toBe(true);
    const body = new URLSearchParams(vi.mocked(axios.post).mock.calls[0][1] as string);
    expect(body.get('code_verifier')).toBe('verifier');
  });
});
