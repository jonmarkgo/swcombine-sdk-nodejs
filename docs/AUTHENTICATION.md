# Authentication Guide

The SW Combine API uses OAuth 2.0 for authentication. This guide explains how to set up OAuth and obtain access tokens.

## OAuth Flow Overview

1. **Register your application** with SW Combine
2. **Request authorization** from the user
3. **Exchange authorization code** for access token
4. **Use access token** to make authenticated API requests
5. **Refresh token** when it expires (optional)

## Quick Start: Get an Access Token

The SDK includes a helper script to obtain access tokens easily:

```bash
# 1. Set your OAuth credentials in .env
echo "SWC_CLIENT_ID=your_client_id" >> .env
echo "SWC_CLIENT_SECRET=your_client_secret" >> .env

# 2. Run the OAuth helper
npm run get-token

# 3. Visit http://localhost:3000 in your browser
# 4. Authorize the app
# 5. Copy the access token to your .env file
```

See [getting-oauth-token.md](./getting-oauth-token.md) for detailed instructions.

## Manual OAuth Implementation

### Step 1: Register Your Application

Visit the SW Combine developer portal to register your application and obtain:
- **Client ID**
- **Client Secret**
- **Redirect URI** (callback URL)

### Step 2: Initialize SDK

```typescript
import { SWCombine, AccessType, CharacterScopes, MessageScopes } from 'swcombine-sdk';

const client = new SWCombine({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  redirectUri: 'http://localhost:3000/callback',
  accessType: AccessType.Offline, // Request refresh token
});
```

OAuth-only methods require full OAuth mode (`clientId` + `clientSecret`):
- `client.auth.getAuthorizationUrl(...)`
- `client.auth.handleCallback(...)`
- `client.auth.revokeToken(...)`
- `client.refreshToken()`

### Step 3: Generate Authorization URL

```typescript
import { CharacterScopes, MessageScopes } from 'swcombine-sdk';

const authUrl = client.auth.getAuthorizationUrl({
  scopes: [
    CharacterScopes.READ,
    CharacterScopes.STATS,
    MessageScopes.READ,
    MessageScopes.SEND,
  ],
  state: 'random-string-for-csrf-protection',
});

// Redirect user to authUrl
console.log('Visit:', authUrl);
```

### Step 4: Handle Callback

When the user authorizes your app, they'll be redirected to your callback URL with a code:

```
http://localhost:3000/callback?code=abc123&state=random-string
```

Exchange this code for an access token:

```typescript
// In your callback handler
app.get('/callback', async (req, res) => {
  const { code, state } = req.query;

  // Verify state to prevent CSRF
  if (state !== savedState) {
    return res.status(400).send('Invalid state');
  }

  // Exchange code for token
  const result = await client.auth.handleCallback({ code, state });

  if (result.success) {
    const token = result.token!;

    console.log('Access Token:', token.accessToken);
    console.log('Refresh Token:', token.refreshToken);
    console.log('Expires At:', new Date(token.expiresAt));

    // Save tokens securely
    saveTokens(token);

    res.send('Authorization successful!');
  } else {
    res.status(400).send(`Error: ${result.error}`);
  }
});
```

### Step 5: Use Access Token

```typescript
// Create client with access token
const authenticatedClient = new SWCombine({
  token: token.accessToken,
});

// Make authenticated requests
const character = await authenticatedClient.character.get({
  uid: '1:12345',
});
```

## Token Management

### Access Token Expiration

Access tokens typically expire after 1 hour. The SDK automatically refreshes tokens when:
- A request returns 401 Unauthorized
- You have provided a refresh token

If you only have a personal access token, pass it as a string:

```typescript
const tokenOnlyClient = new SWCombine({
  token: 'my_personal_token',
});
```

```typescript
const client = new SWCombine({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  token: 'your-access-token',
});

// If you have a full OAuth token (access + refresh), set it:
client.setToken(token);

// Then if the access token expires, SDK will:
// 1. Use refresh token to get new access token
// 2. Retry the failed request
// 3. Continue working seamlessly
```

### Manual Token Refresh

You can manually refresh a token:

```typescript
await client.refreshToken();

const refreshedToken = client.getToken();
console.log('New Access Token:', refreshedToken?.accessToken);
console.log('Expires At:', refreshedToken ? new Date(refreshedToken.expiresAt) : 'n/a');
```

### Custom Token Persistence

You can persist tokens with `getToken()` and restore them later with `setToken()`:

```typescript
const token = client.getToken();
if (token) {
  await saveTokenToDatabase(token);
}

const loadedToken = await loadTokenFromDatabase();
if (loadedToken) {
  client.setToken(loadedToken);
}
```

## OAuth Scopes

Scopes determine what permissions your app has. Request only the scopes you need.

### Using Scope Constants

```typescript
import {
  CharacterScopes,
  MessageScopes,
  Scopes,
  getReadOnlyScopes,
} from 'swcombine-sdk';

// Specific scopes
const scopes = [
  CharacterScopes.READ,
  CharacterScopes.STATS,
  MessageScopes.READ,
  Scopes.PersonalInventory.SHIPS.READ,
];

// Or use helpers
const readOnlyScopes = getReadOnlyScopes();
```

See [SCOPES.md](./SCOPES.md) for complete scope documentation.

## Complete OAuth Example

Here's a complete Express.js example:

```typescript
import express from 'express';
import session from 'express-session';
import { SWCombine, CharacterScopes, MessageScopes } from 'swcombine-sdk';

const app = express();

app.use(session({
  secret: 'your-session-secret',
  resave: false,
  saveUninitialized: true,
}));

const client = new SWCombine({
  clientId: process.env.SWC_CLIENT_ID!,
  clientSecret: process.env.SWC_CLIENT_SECRET!,
  redirectUri: 'http://localhost:3000/callback',
});

// Login route
app.get('/login', (req, res) => {
  const state = Math.random().toString(36).substring(7);
  req.session.oauthState = state;

  const authUrl = client.auth.getAuthorizationUrl({
    scopes: [
      CharacterScopes.READ,
      CharacterScopes.STATS,
      MessageScopes.READ,
    ],
    state,
  });

  res.redirect(authUrl);
});

// Callback route
app.get('/callback', async (req, res) => {
  try {
    // Verify state
    if (req.query.state !== req.session.oauthState) {
      return res.status(400).send('Invalid state');
    }

    // Exchange code for token
    const result = await client.auth.handleCallback(req.query);

    if (!result.success) {
      return res.status(400).send(`Error: ${result.error}`);
    }

    // Save token in session (in production, use secure storage)
    req.session.token = result.token;

    res.redirect('/dashboard');
  } catch (error) {
    console.error('OAuth error:', error);
    res.status(500).send('Authentication failed');
  }
});

// Protected route
app.get('/dashboard', async (req, res) => {
  if (!req.session.token) {
    return res.redirect('/login');
  }

  // Create authenticated client
  const authenticatedClient = new SWCombine({
    clientId: process.env.SWC_CLIENT_ID!,
    clientSecret: process.env.SWC_CLIENT_SECRET!,
    token: req.session.token,
  });

  // Identify the caller via the `/character/` endpoint (requires CHARACTER_READ).
  // `OAuthToken` itself does not carry a character UID.
  const me = await authenticatedClient.character.me();
  const permissions = await authenticatedClient.character.permissions.list({
    uid: me.uid,
  });

  res.send(`Welcome ${me.name}! You have ${permissions.permission.length} permissions.`);
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
  console.log('Visit http://localhost:3000/login to start OAuth flow');
});
```

## Security Best Practices

### 1. Store Credentials Securely

Never commit credentials to version control:

```bash
# .env (add to .gitignore)
SWC_CLIENT_ID=your_client_id
SWC_CLIENT_SECRET=your_client_secret
SWC_ACCESS_TOKEN=your_access_token
```

### 2. Use HTTPS in Production

Always use HTTPS for redirect URIs in production:

```typescript
const client = new SWCombine({
  redirectUri: 'https://yourapp.com/callback', // ✓ HTTPS
  // redirectUri: 'http://yourapp.com/callback', // ✗ HTTP (insecure)
});
```

### 3. Validate State Parameter

Always validate the state parameter to prevent CSRF attacks:

```typescript
if (req.query.state !== savedState) {
  throw new Error('Invalid state - possible CSRF attack');
}
```

### 4. Implement Token Rotation

Refresh tokens before they expire:

```typescript
// Refresh token 5 minutes before expiry
const expiresIn = token.expiresAt - Date.now();
const refreshIn = expiresIn - (5 * 60 * 1000);

setTimeout(async () => {
  await client.refreshToken();
  const newToken = client.getToken();
  // Update stored token if newToken is set
}, refreshIn);
```

### 5. Handle Token Expiration

Always handle token expiration errors:

```typescript
import { SWCError } from 'swcombine-sdk';

try {
  const data = await client.character.get({ uid: '1:12345' });
} catch (error) {
  if (error instanceof SWCError && error.statusCode === 401) {
    // Token expired - redirect to login
    res.redirect('/login');
  }
}
```

## Troubleshooting

### "Access Token Not Provided"

Make sure you're passing the access token:

```typescript
const client = new SWCombine({
  token: 'your-access-token', // Don't forget this!
});
```

### "Invalid Scope"

Scope values are **lowercase** (e.g. `character_read`, `messages_send`). Prefer the
typed constants so the case and spelling are handled for you:

```typescript
import { CharacterScopes, MessageScopes } from 'swcombine-sdk';

// ✓ Correct — constants resolve to lowercase literals
scopes: [CharacterScopes.READ, MessageScopes.SEND]

// ✓ Also correct — raw lowercase strings
scopes: ['character_read', 'messages_send']

// ✗ Wrong — uppercase is rejected by the API
scopes: ['CHARACTER_READ', 'MESSAGES_SEND']
```

### "Redirect URI Mismatch"

The redirect URI must exactly match what you registered:

```typescript
// If you registered: http://localhost:3000/callback
redirectUri: 'http://localhost:3000/callback', // ✓

// These will NOT work:
redirectUri: 'http://localhost:3000/callback/', // ✗ (trailing slash)
redirectUri: 'https://localhost:3000/callback', // ✗ (https vs http)
```

## Next Steps

- **[OAuth Scopes Guide](./SCOPES.md)** - Learn about available permissions
- **[Getting Started](./GETTING_STARTED.md)** - Basic SDK usage
- **[API Reference](https://jonmarkgo.github.io/swcombine-sdk-nodejs/)** - Full TypeDoc reference
