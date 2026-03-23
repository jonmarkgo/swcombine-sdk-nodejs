/**
 * Basic usage example for SW Combine SDK
 */

import { SWCombine } from '../src/index.js';

async function main() {
  // Initialize the client
  const swc = new SWCombine({
    clientId: process.env.SWC_CLIENT_ID!,
    clientSecret: process.env.SWC_CLIENT_SECRET!,
    token: process.env.SWC_ACCESS_TOKEN, // Optional: provide existing token
  });

  try {
    // Test basic API call
    const hello = await swc.api.helloWorld();
    console.log('Hello World:', hello);

    // Get character information
    const character = await swc.character.get({ uid: '12345' });
    console.log('Character:', character);

    // List factions
    const factions = await swc.faction.list();
    console.log(`Found ${factions.data.length} factions`);

    // Get galaxy information
    const planets = await swc.galaxy.planets.list();
    console.log(`Found ${planets.data.length} planets`);

    // Check rate limits
    const rateLimits = await swc.api.rateLimits();
    console.log('Rate Limits:', rateLimits);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
