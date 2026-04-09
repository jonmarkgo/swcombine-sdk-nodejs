/**
 * OAuth flow example for SW Combine SDK
 * This example shows how to integrate with an Express server
 */

import express from 'express';
import session from 'express-session';
import {
  SWCombine,
  AccessType,
  MessageMode,
  CharacterScopes,
  FactionScopes,
  MessageScopes,
} from '../src/index.js';

const app = express();

// Set up session middleware
app.use(
  session({
    secret: 'your-session-secret',
    resave: false,
    saveUninitialized: false,
  })
);

// Initialize SDK
const swc = new SWCombine({
  clientId: process.env.SWC_CLIENT_ID!,
  clientSecret: process.env.SWC_CLIENT_SECRET!,
  redirectUri: 'http://localhost:3000/callback',
  accessType: AccessType.Offline, // Get refresh token for offline access
});

// Login route - redirect to SW Combine
app.get('/login', (req, res) => {
  const state = Math.random().toString(36).substring(7);
  req.session.oauthState = state;

  const authUrl = swc.auth.getAuthorizationUrl({
    scopes: [CharacterScopes.READ, FactionScopes.READ, MessageScopes.READ],
    state,
  });

  res.redirect(authUrl);
});

// OAuth callback route
app.get('/callback', async (req, res) => {
  try {
    // Verify state parameter
    if (req.query.state !== req.session.oauthState) {
      return res.status(400).send('Invalid state parameter');
    }

    // Handle the OAuth callback
    const result = await swc.auth.handleCallback(req.query);

    if (!result.success) {
      return res.status(400).send(`OAuth failed: ${result.error}`);
    }

    // Store token in session
    req.session.token = result.token;

    res.redirect('/dashboard');
  } catch (error) {
    console.error('OAuth error:', error);
    res.status(500).send('OAuth failed');
  }
});

// Dashboard route - requires authentication
app.get('/dashboard', async (req, res) => {
  if (!req.session.token) {
    return res.redirect('/login');
  }

  try {
    // Set token for this request
    swc.setToken(req.session.token);

    // Fetch user data
    const character = await swc.character.get({ uid: 'your-character-uid' });
    const messages = await swc.character.messages.list({
      uid: character.uid,
      mode: MessageMode.Received,
    });

    res.json({
      character,
      messages,
    });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).send('Failed to fetch data');
  }
});

// Logout route
app.get('/logout', async (req, res) => {
  if (req.session.token?.refreshToken) {
    try {
      // Revoke the refresh token
      await swc.auth.revokeToken(req.session.token.refreshToken);
    } catch (error) {
      console.error('Failed to revoke token:', error);
    }
  }

  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
  console.log('Visit http://localhost:3000/login to start OAuth flow');
});
