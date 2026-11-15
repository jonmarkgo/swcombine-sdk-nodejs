import { SWCombine, type TypesEntityType } from '../src';

const ENTITY_TYPES: TypesEntityType[] = [
  'ships',
  'vehicles',
  'stations',
  'facilities',
  'items',
  'npcs',
  'droids',
  'materials',
  'races',
  'weapons',
  'planets',
  'terrain',
  'creatures',
  'factionmodules',
];

type EntityTestStatus = 'ok' | 'error' | 'empty';

interface EntityTestResult {
  entityType: TypesEntityType;
  status: EntityTestStatus;
  uid?: string;
  name?: string;
  error?: string;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

async function testEntityType(
  client: SWCombine,
  entityType: TypesEntityType
): Promise<EntityTestResult> {
  try {
    const entities = await client.types.entities.list({
      entityType,
      item_count: 1,
    });

    if (!entities.length) {
      return {
        entityType,
        status: 'empty',
      };
    }

    const uid = entities[0]?.attributes?.uid;
    if (!uid) {
      return {
        entityType,
        status: 'error',
        error: 'Missing UID in first list item',
      };
    }

    const entity = await client.types.entities.get({
      entityType,
      uid,
    });

    return {
      entityType,
      status: 'ok',
      uid,
      name: typeof entity.name === 'string' ? entity.name : undefined,
    };
  } catch (error: unknown) {
    return {
      entityType,
      status: 'error',
      error: getErrorMessage(error),
    };
  }
}

function printResult(result: EntityTestResult): void {
  const paddedType = result.entityType.padEnd(14, ' ');

  if (result.status === 'ok') {
    const name = result.name ?? '';
    console.log(`OK    ${paddedType}  ${result.uid}  ${name}`.trimEnd());
    return;
  }

  if (result.status === 'empty') {
    console.log(`EMPTY ${paddedType}  no list results`);
    return;
  }

  console.log(`ERR   ${paddedType}  ${result.error ?? 'Unknown error'}`);
}

async function run(): Promise<void> {
  const client = new SWCombine({
    clientId: '',
    clientSecret: '',
  });

  const results: EntityTestResult[] = [];

  for (const entityType of ENTITY_TYPES) {
    const result = await testEntityType(client, entityType);
    results.push(result);
    printResult(result);

    console.log('Sleeping for 1 second to avoid rate limits...');
    await new Promise((resolve) => setTimeout(resolve, 1_000)); // Add a small delay to avoid hitting rate limits
  }

  const okCount = results.filter((result) => result.status === 'ok').length;
  const emptyCount = results.filter((result) => result.status === 'empty').length;
  const errorCount = results.filter((result) => result.status === 'error').length;

  console.log(
    `Summary: ok=${okCount} empty=${emptyCount} error=${errorCount} total=${results.length}`
  );

  if (errorCount > 0) {
    process.exitCode = 1;
  }
}

run().catch((error: unknown) => {
  console.error(`ERR   run            ${getErrorMessage(error)}`);
  process.exitCode = 1;
});
