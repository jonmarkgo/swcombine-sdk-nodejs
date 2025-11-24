/**
 * Refresh an expired access token using a refresh token
 */

import { config } from 'dotenv';
import { SWCombine } from '../src/index.js';

config();

async function main() {
  const clientId = process.env.SWC_CLIENT_ID;
  const clientSecret = process.env.SWC_CLIENT_SECRET;
  const refreshToken = process.env.SWC_REFRESH_TOKEN;

  if (!clientId || !clientSecret) {
    console.error('❌ Missing SWC_CLIENT_ID or SWC_CLIENT_SECRET in .env');
    process.exit(1);
  }

  if (!refreshToken) {
    console.error('❌ Missing SWC_REFRESH_TOKEN in .env');
    console.error('   Run: npm run get-token');
    process.exit(1);
  }

  console.log('🔄 Refreshing access token...\n');

  const client = new SWCombine({
    clientId,
    clientSecret,
    token: {
      accessToken: process.env.SWC_ACCESS_TOKEN || '',
      refreshToken: refreshToken,
      expiresAt: 0, // Expired
    },
  });

  try {
    await client.refreshToken();
    const newToken = client.getToken();

    if (!newToken) {
      throw new Error('Failed to get refreshed token');
    }

    console.log('✅ Token refreshed successfully!\n');
    console.log('📋 New tokens:');
    console.log('   Access Token:', newToken.accessToken);
    console.log('   Refresh Token:', newToken.refreshToken || refreshToken);
    const expiresIn = Math.floor((newToken.expiresAt - Date.now()) / 1000);
    console.log('   Expires In:', expiresIn, 'seconds');
    console.log('   Expires At:', new Date(newToken.expiresAt).toLocaleString());
    console.log('\n💾 Update your .env file with:');
    console.log(`   SWC_ACCESS_TOKEN=${newToken.accessToken}`);
    if (newToken.refreshToken) {
      console.log(`   SWC_REFRESH_TOKEN=${newToken.refreshToken}`);
    }
  } catch (error: any) {
    console.error('❌ Failed to refresh token:', error.message);
    if (error.response?.data) {
      console.error('   API Response:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('\n   The refresh token may have expired. Run: npm run get-token');
    process.exit(1);
  }
}

main().catch(console.error);
