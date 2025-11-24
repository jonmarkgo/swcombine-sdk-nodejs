/**
 * Type validators for integration tests
 * These validate that API responses match our TypeScript type definitions
 */

/**
 * Validate that an object has required fields
 */
export function assertHasFields(obj: any, fields: string[], context: string): void {
  const missing = fields.filter((field) => !(field in obj));
  if (missing.length > 0) {
    console.error(`❌ ${context}: Missing fields:`, missing);
    console.error('   Actual object:', obj);
    throw new Error(`${context}: Missing required fields: ${missing.join(', ')}`);
  }
}

/**
 * Validate field types
 */
export function assertFieldType(
  obj: any,
  field: string,
  expectedType: string,
  context: string
): void {
  if (!(field in obj)) {
    return; // Field doesn't exist, handled by assertHasFields
  }

  const actualType = typeof obj[field];
  if (actualType !== expectedType && obj[field] !== null) {
    console.error(`❌ ${context}: Field '${field}' has wrong type`);
    console.error(`   Expected: ${expectedType}, Got: ${actualType}`);
    console.error(`   Value:`, obj[field]);
    throw new Error(`${context}: Field '${field}' should be ${expectedType}, got ${actualType}`);
  }
}

/**
 * Validate array field
 */
export function assertIsArray(obj: any, field: string, context: string): void {
  if (!(field in obj)) {
    return;
  }

  if (!Array.isArray(obj[field])) {
    console.error(`❌ ${context}: Field '${field}' should be an array`);
    console.error(`   Got:`, typeof obj[field]);
    throw new Error(`${context}: Field '${field}' should be an array`);
  }
}

/**
 * Log type mismatches without failing
 */
export function warnTypeMismatch(
  context: string,
  field: string,
  expected: string,
  actual: any
): void {
  console.warn(`⚠️  Type mismatch in ${context}:`);
  console.warn(`   Field: ${field}`);
  console.warn(`   Expected: ${expected}`);
  console.warn(`   Actual type: ${typeof actual}`);
  console.warn(`   Value:`, actual);
}

/**
 * Validate Character type
 */
export function validateCharacter(character: any, context: string = 'Character'): void {
  console.log(`\n🔍 Validating ${context} structure...`);

  // Required fields
  assertHasFields(character, ['uid'], context);
  assertFieldType(character, 'uid', 'string', context);

  // Common optional fields
  const optionalFields = ['handle', 'name', 'race', 'faction', 'credits', 'location'];
  optionalFields.forEach((field) => {
    if (field in character && character[field] !== null) {
      if (field === 'credits') {
        // Credits can be a number OR an object with { attributes, value }
        if (typeof character[field] !== 'number' && typeof character[field] !== 'object') {
          warnTypeMismatch(context, field, 'number or object', character[field]);
        }
      } else if (field === 'location' || field === 'faction' || field === 'race') {
        // Can be object or string (reference)
        if (typeof character[field] !== 'object' && typeof character[field] !== 'string') {
          warnTypeMismatch(context, field, 'object or string', character[field]);
        }
      } else {
        assertFieldType(character, field, 'string', context);
      }
    }
  });

  // Document all fields found
  const allFields = Object.keys(character);
  console.log(`✓ ${context} has ${allFields.length} fields:`, allFields.join(', '));

  // Warn about unexpected fields
  const expectedFields = ['uid', 'handle', 'name', 'race', 'faction', 'credits', 'location'];
  const unexpectedFields = allFields.filter((f) => !expectedFields.includes(f));
  if (unexpectedFields.length > 0) {
    console.log(`ℹ️  ${context} has additional fields we didn't type:`, unexpectedFields.join(', '));
  }
}

/**
 * Validate Faction type
 */
export function validateFaction(faction: any, context: string = 'Faction'): void {
  console.log(`\n🔍 Validating ${context} structure...`);

  assertHasFields(faction, ['uid', 'name'], context);
  assertFieldType(faction, 'uid', 'string', context);
  assertFieldType(faction, 'name', 'string', context);

  const allFields = Object.keys(faction);
  console.log(`✓ ${context} has ${allFields.length} fields:`, allFields.join(', '));
}

/**
 * Validate RateLimitInfo type
 */
export function validateRateLimitInfo(info: any, context: string = 'RateLimitInfo'): void {
  console.log(`\n🔍 Validating ${context} structure...`);

  assertHasFields(info, ['limit', 'remaining', 'reset'], context);
  assertFieldType(info, 'limit', 'number', context);
  assertFieldType(info, 'remaining', 'number', context);
  assertFieldType(info, 'reset', 'number', context);

  const allFields = Object.keys(info);
  console.log(`✓ ${context} has ${allFields.length} fields:`, allFields.join(', '));

  const unexpectedFields = allFields.filter(
    (f) => !['limit', 'remaining', 'reset', 'resetTime', 'reset_time'].includes(f)
  );
  if (unexpectedFields.length > 0) {
    console.log(`ℹ️  ${context} has additional fields:`, unexpectedFields.join(', '));
  }
}

/**
 * Validate array of items
 */
export function validateArray<T>(
  array: any,
  validator: (item: any, context: string) => void,
  itemName: string,
  minItems: number = 0
): void {
  if (!Array.isArray(array)) {
    throw new Error(`Expected array, got ${typeof array}`);
  }

  console.log(`\n📊 Validating array of ${itemName} (${array.length} items)...`);

  if (array.length < minItems) {
    console.warn(`⚠️  Expected at least ${minItems} items, got ${array.length}`);
  }

  if (array.length > 0) {
    console.log(`   Validating first item as example...`);
    validator(array[0], `${itemName}[0]`);
  }
}

/**
 * Validate Planet type
 */
export function validatePlanet(planet: any, context: string = 'Planet'): void {
  console.log(`\n🔍 Validating ${context} structure...`);

  assertHasFields(planet, ['uid', 'name'], context);
  assertFieldType(planet, 'uid', 'string', context);
  assertFieldType(planet, 'name', 'string', context);

  const allFields = Object.keys(planet);
  console.log(`✓ ${context} has ${allFields.length} fields:`, allFields.join(', '));
}

/**
 * Summary of validation results
 */
export function printValidationSummary(): void {
  console.log('\n' + '='.repeat(60));
  console.log('📋 Type Validation Summary');
  console.log('='.repeat(60));
  console.log('Check the logs above for:');
  console.log('  ✓ Successfully validated fields');
  console.log('  ⚠️  Type mismatches (need to update our types)');
  console.log('  ℹ️  Additional fields (not in our types yet)');
  console.log('');
  console.log('💡 Review api-responses/*.json files to refine types');
  console.log('='.repeat(60) + '\n');
}
