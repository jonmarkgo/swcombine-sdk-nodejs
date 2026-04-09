/**
 * Helper script to get your character UID
 *
 * Usage:
 *   npm run get-character-uid YourHandle
 */

import { config } from 'dotenv';
import { SWCombine } from '../src/index.js';

// Load environment variables
config();

const handle = process.argv[2];

if (!handle) {
  console.error('❌ Please provide your character handle');
  console.error('');
  console.error('Usage: npm run get-character-uid YourHandle');
  console.error('');
  process.exit(1);
}

async function main() {
  const client = new SWCombine({
    clientId: process.env.SWC_CLIENT_ID,
    clientSecret: process.env.SWC_CLIENT_SECRET,
    token: process.env.SWC_ACCESS_TOKEN,
  });

  console.log(`🔍 Looking up character: ${handle}`);
  console.log('');

  try {
    const { uid, handle: resolvedHandle } = await client.character.getByHandle({ handle });

    console.log('✅ Character found!');
    console.log('');
    console.log('Character UID:', uid);
    console.log('Handle:', resolvedHandle);
    console.log('');
    console.log('💡 Add this to your .env file:');
    console.log(`TEST_CHARACTER_UID=${uid}`);
    console.log(`TEST_CHARACTER_HANDLE=${resolvedHandle}`);
    console.log('');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.statusCode === 404) {
      console.error('');
      console.error('Character not found. Please check the handle and try again.');
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
