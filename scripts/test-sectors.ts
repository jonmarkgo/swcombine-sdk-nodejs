/**
 * Quick test script for sectors endpoint
 */

import { config } from 'dotenv';
import { SWCombine } from '../src/index.js';

config();

async function main() {
  const client = new SWCombine({
    clientId: process.env.SWC_CLIENT_ID!,
    clientSecret: process.env.SWC_CLIENT_SECRET!,
    // No token - this endpoint doesn't require auth according to docs
  });

  console.log('🌌 Testing sectors.list() with pagination...\n');

  try {
    const sectors = await client.galaxy.sectors.list();
    console.log(
      '✅ Success! Retrieved sectors:',
      (sectors as any).sector?.length || sectors.length
    );
    console.log('\nFirst sector:', (sectors as any).sector?.[0] || sectors[0]);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.statusCode) {
      console.error('   Status:', error.statusCode);
    }
    if (error.response) {
      console.error('   Response:', JSON.stringify(error.response, null, 2));
    }
  }
}

main().catch(console.error);
