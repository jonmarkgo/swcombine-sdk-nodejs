# Getting an OAuth Access Token for Integration Tests

This guide will help you get an OAuth access token to run integration tests.

## Quick Start

1. **Set up your credentials in `.env`:**
   ```bash
   SWC_CLIENT_ID=your_client_id
   SWC_CLIENT_SECRET=your_client_secret
   ```

2. **Run the OAuth helper app:**
   ```bash
   npm run get-token
   ```

3. **Follow the steps:**
   - Open http://localhost:3000 in your browser
   - Click "Authorize App"
   - Authorize on SW Combine
   - Copy the access token shown

4. **Add token to `.env`:**
   ```bash
   SWC_ACCESS_TOKEN=your_access_token_here
   ```

5. **Run integration tests:**
   ```bash
   npm run test:integration
   ```

## Prerequisites

### 1. Register OAuth App with SW Combine

Before you can get an access token, you need to register an OAuth application:

1. Visit the SW Combine developer portal (usually at `https://www.swcombine.com/ws/developers/`)
2. Create a new OAuth application
3. Set the callback URL to: `http://localhost:3000/callback`
4. Save your Client ID and Client Secret

### 2. Configure .env File

Create a `.env` file in the project root:

```bash
# Copy the example
cp .env.example .env

# Edit .env and add:
SWC_CLIENT_ID=your_client_id_here
SWC_CLIENT_SECRET=your_client_secret_here
```

## Running the OAuth Helper

```bash
npm run get-token
```

You should see:

```
🚀 OAuth Token Exchange Server Started!
=========================================

✓ Server running at: http://localhost:3000
✓ Callback URL: http://localhost:3000/callback

📋 Steps:
  1. Open http://localhost:3000 in your browser
  2. Click "Authorize App"
  3. Grant permissions on SW Combine
  4. Copy the access token to your .env file

⚠️  Make sure http://localhost:3000/callback is registered
   in your SW Combine OAuth application!
```

## Authorization Flow

1. **Start the server** - The OAuth helper runs on port 3000
2. **Visit homepage** - Go to http://localhost:3000
3. **Click "Authorize App"** - Redirects to SW Combine
4. **Grant permissions** - Authorize the requested scopes:
   - `character_read` - Read character information
   - `character_skills` - Read character skills
   - `character_credits` - Read character credits
   - `character_location` - Read character location
   - `faction_read` - Read faction information
   - `messages_read` - Read messages
5. **Get redirected back** - Returns to http://localhost:3000/callback
6. **Copy your token** - The access token is displayed on screen

## Token Information

The OAuth helper provides:
- **Access Token** - Use this for API requests (expires in ~1 hour)
- **Refresh Token** - Can be used to get a new access token (if `accessType: 'offline'`)
- **Expiry Time** - When the access token expires

## Using the Token

Add the access token to your `.env` file:

```bash
SWC_ACCESS_TOKEN=your_very_long_access_token_string_here
```

Now run integration tests:

```bash
# All tests
npm run test:integration

# Specific test
npm run test:integration tests/integration/character.test.ts
```

## Troubleshooting

### Error: "Missing required credentials"
- Make sure `SWC_CLIENT_ID` and `SWC_CLIENT_SECRET` are set in `.env`

### Error: "Invalid state parameter"
- This is a security check. Try the authorization flow again from the start.

### Error: "redirect_uri_mismatch"
- Make sure `http://localhost:3000/callback` is registered in your SW Combine OAuth app settings

### Port 3000 already in use
- Stop any other services running on port 3000
- Or edit `scripts/get-oauth-token.ts` to use a different port

### Token expired
- Access tokens expire after ~1 hour
- Run `npm run get-token` again to get a new one
- Or implement token refresh in your tests (if you saved the refresh token)

## Alternative: Manual OAuth Flow

If you prefer to do it manually without the helper:

1. Visit:
   ```
   https://www.swcombine.com/ws/oauth2/auth/?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:3000/callback&scope=character_read&state=test
   ```

2. After authorization, you'll be redirected to:
   ```
   http://localhost:3000/callback?code=AUTHORIZATION_CODE&state=test
   ```

3. Exchange the code for a token using curl:
   ```bash
   curl -X POST https://www.swcombine.com/ws/oauth2/token/ \
     -d "code=AUTHORIZATION_CODE" \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "redirect_uri=http://localhost:3000/callback" \
     -d "grant_type=authorization_code"
   ```

4. Copy the `access_token` from the response

## Security Notes

- ⚠️ **Never commit your `.env` file** - It contains secrets
- ⚠️ **Access tokens expire** - They're short-lived (usually 1 hour)
- ⚠️ **Refresh tokens are long-lived** - Store them securely if you need them
- ✅ **Use HTTPS in production** - localhost HTTP is fine for testing only

## Next Steps

Once you have your access token:
1. Run integration tests to validate the SDK
2. Check captured responses in `tests/integration/api-responses/`
3. Refine TypeScript types based on real API data
