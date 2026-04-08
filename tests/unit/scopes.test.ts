import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  CharacterScopes,
  FactionInventoryScopes,
  FactionScopes,
  getAllCharacterScopes,
  getAllFactionInventoryScopes,
  getAllFactionScopes,
  getAllMessageScopes,
  getAllPersonalInventoryScopes,
  getAllScopes,
  getMinimalScopes,
  getReadOnlyScopes,
  MessageScopes,
  PersonalInventoryScopes,
  Scopes,
} from '../../src/auth/scopes.js';
import type {
  AllScopes,
  CharacterScope,
  FactionInventoryScope,
  FactionScope,
  MessageScope,
  PersonalInventoryScope,
} from '../../src/auth/scopes.js';

function buildInventoryScopes(
  prefix: 'personal_inv' | 'faction_inv',
  entityType: string,
  options: { rename?: boolean; assign?: boolean; makeover?: boolean } = {}
): Record<string, string> {
  const { rename = true, assign = true, makeover = true } = options;
  const scopes: Record<string, string> = {
    READ: `${prefix}_${entityType}_read`,
  };

  if (rename) {
    scopes.RENAME = `${prefix}_${entityType}_rename`;
  }

  if (assign) {
    scopes.ASSIGN = `${prefix}_${entityType}_assign`;
  }

  if (makeover) {
    scopes.MAKEOVER = `${prefix}_${entityType}_makeover`;
  }

  scopes.TAGS_READ = `${prefix}_${entityType}_tags_read`;
  scopes.TAGS_WRITE = `${prefix}_${entityType}_tags_write`;
  scopes.ALL = `${prefix}_${entityType}_all`;

  return scopes;
}

function flattenInventoryScopes(scopeGroups: Record<string, unknown>): string[] {
  const scopes: string[] = [];

  Object.values(scopeGroups).forEach((value) => {
    if (typeof value === 'string') {
      scopes.push(value);
      return;
    }

    scopes.push(...Object.values(value as Record<string, string>));
  });

  return scopes;
}

describe('OAuth scope catalog', () => {
  const expectedCharacterScopes = {
    AUTH: 'character_auth',
    READ: 'character_read',
    STATS: 'character_stats',
    PRIVILEGES: 'character_privileges',
    SKILLS: 'character_skills',
    CREDITS: 'character_credits',
    CREDITS_WRITE: 'character_credits_write',
    FORCE: 'character_force',
    LOCATION: 'character_location',
    EVENTS: 'character_events',
    ALL: 'character_all',
  };

  const expectedMessageScopes = {
    READ: 'messages_read',
    SEND: 'messages_send',
    DELETE: 'messages_delete',
    ALL: 'messages_all',
  };

  const expectedPersonalInventoryScopes = {
    OVERVIEW: 'personal_inv_overview',
    SHIPS: buildInventoryScopes('personal_inv', 'ships'),
    VEHICLES: buildInventoryScopes('personal_inv', 'vehicles'),
    STATIONS: buildInventoryScopes('personal_inv', 'stations'),
    CITIES: buildInventoryScopes('personal_inv', 'cities'),
    FACILITIES: buildInventoryScopes('personal_inv', 'facilities'),
    PLANETS: buildInventoryScopes('personal_inv', 'planets', { rename: false, makeover: false }),
    ITEMS: buildInventoryScopes('personal_inv', 'items'),
    NPCS: {
      READ: 'personal_inv_npcs_read',
      ASSIGN: 'personal_inv_npcs_assign',
      MAKEOVER: 'personal_inv_npcs_makeover',
      TAGS_READ: 'personal_inv_npcs_tags_read',
      TAGS_WRITE: 'personal_inv_npcs_tags_write',
      ALL: 'personal_inv_npcs_all',
    },
    DROIDS: buildInventoryScopes('personal_inv', 'droids'),
    MATERIALS: buildInventoryScopes('personal_inv', 'materials', { assign: false }),
    CREATURES: buildInventoryScopes('personal_inv', 'creatures'),
  };

  const expectedFactionScopes = {
    READ: 'faction_read',
    MEMBERS: 'faction_members',
    STOCKS: 'faction_stocks',
    CREDITS_READ: 'faction_credits_read',
    CREDITS_WRITE: 'faction_credits_write',
    BUDGETS_READ: 'faction_budgets_read',
    BUDGETS_WRITE: 'faction_budgets_write',
    DATACARDS_READ: 'faction_datacards_read',
    DATACARDS_WRITE: 'faction_datacards_write',
    ALL: 'faction_all',
  };

  const expectedFactionInventoryScopes = {
    OVERVIEW: 'faction_inv_overview',
    SHIPS: buildInventoryScopes('faction_inv', 'ships'),
    VEHICLES: buildInventoryScopes('faction_inv', 'vehicles'),
    STATIONS: buildInventoryScopes('faction_inv', 'stations'),
    CITIES: buildInventoryScopes('faction_inv', 'cities'),
    FACILITIES: buildInventoryScopes('faction_inv', 'facilities'),
    PLANETS: buildInventoryScopes('faction_inv', 'planets', { rename: false, makeover: false }),
    ITEMS: buildInventoryScopes('faction_inv', 'items'),
    NPCS: {
      READ: 'faction_inv_npcs_read',
      ASSIGN: 'faction_inv_npcs_assign',
      MAKEOVER: 'faction_inv_npcs_makeover',
      TAGS_READ: 'faction_inv_npcs_tags_read',
      TAGS_WRITE: 'faction_inv_npcs_tags_write',
      ALL: 'faction_inv_npcs_all',
    },
    DROIDS: buildInventoryScopes('faction_inv', 'droids'),
    MATERIALS: buildInventoryScopes('faction_inv', 'materials', { assign: false }),
    CREATURES: buildInventoryScopes('faction_inv', 'creatures'),
  };

  it('matches the provided permission catalog values', () => {
    expect(CharacterScopes).toEqual(expectedCharacterScopes);
    expect(MessageScopes).toEqual(expectedMessageScopes);
    expect(PersonalInventoryScopes).toEqual(expectedPersonalInventoryScopes);
    expect(FactionScopes).toEqual(expectedFactionScopes);
    expect(FactionInventoryScopes).toEqual(expectedFactionInventoryScopes);
  });

  it('preserves special-case inventory shapes and nested access paths', () => {
    expect(expectedPersonalInventoryScopes.PLANETS).not.toHaveProperty('RENAME');
    expect(expectedPersonalInventoryScopes.PLANETS).not.toHaveProperty('MAKEOVER');
    expect(expectedPersonalInventoryScopes.NPCS).not.toHaveProperty('RENAME');
    expect(expectedPersonalInventoryScopes.MATERIALS).not.toHaveProperty('ASSIGN');

    expect(expectedFactionInventoryScopes.PLANETS).not.toHaveProperty('RENAME');
    expect(expectedFactionInventoryScopes.PLANETS).not.toHaveProperty('MAKEOVER');
    expect(expectedFactionInventoryScopes.NPCS).not.toHaveProperty('RENAME');
    expect(expectedFactionInventoryScopes.MATERIALS).not.toHaveProperty('ASSIGN');

    expect(Scopes.PersonalInventory.NPCS.TAGS_READ).toBe('personal_inv_npcs_tags_read');
    expect(Scopes.FactionInventory.NPCS.TAGS_READ).toBe('faction_inv_npcs_tags_read');
    expect(Scopes.PersonalInventory.MATERIALS.TAGS_WRITE).toBe('personal_inv_materials_tags_write');
    expect(Scopes.FactionInventory.PLANETS.ASSIGN).toBe('faction_inv_planets_assign');
  });

  it('exposes generated inventory scopes with exact property typing', () => {
    expectTypeOf(PersonalInventoryScopes.SHIPS.TAGS_READ).toEqualTypeOf<'personal_inv_ships_tags_read'>();
    expectTypeOf(PersonalInventoryScopes.SHIPS.RENAME).toEqualTypeOf<'personal_inv_ships_rename'>();
    expectTypeOf(PersonalInventoryScopes.PLANETS.ASSIGN).toEqualTypeOf<'personal_inv_planets_assign'>();
    expectTypeOf(FactionInventoryScopes.SHIPS.TAGS_READ).toEqualTypeOf<'faction_inv_ships_tags_read'>();
    expectTypeOf(FactionInventoryScopes.PLANETS.ASSIGN).toEqualTypeOf<'faction_inv_planets_assign'>();
    expectTypeOf(Scopes.PersonalInventory.SHIPS.TAGS_READ).toEqualTypeOf<'personal_inv_ships_tags_read'>();
  });

  it('helpers return narrowed scope unions rather than widened string arrays', () => {
    expectTypeOf(getAllCharacterScopes()).toEqualTypeOf<CharacterScope[]>();
    expectTypeOf(getAllMessageScopes()).toEqualTypeOf<MessageScope[]>();
    expectTypeOf(getAllPersonalInventoryScopes()).toEqualTypeOf<PersonalInventoryScope[]>();
    expectTypeOf(getAllFactionScopes()).toEqualTypeOf<FactionScope[]>();
    expectTypeOf(getAllFactionInventoryScopes()).toEqualTypeOf<FactionInventoryScope[]>();
    expectTypeOf(getAllScopes()).toEqualTypeOf<AllScopes[]>();
    expectTypeOf(getReadOnlyScopes()).toEqualTypeOf<AllScopes[]>();
    expectTypeOf(getMinimalScopes()).toEqualTypeOf<CharacterScope[]>();

    // AllScopes must be a true union of literals, not widened to `string`
    expectTypeOf<AllScopes>().not.toEqualTypeOf<string>();

    // Spot-check that representative leaf literals from every category
    // flow into the AllScopes union
    expectTypeOf<'character_read'>().toMatchTypeOf<AllScopes>();
    expectTypeOf<'messages_send'>().toMatchTypeOf<AllScopes>();
    expectTypeOf<'personal_inv_overview'>().toMatchTypeOf<AllScopes>();
    expectTypeOf<'personal_inv_ships_tags_read'>().toMatchTypeOf<AllScopes>();
    expectTypeOf<'faction_read'>().toMatchTypeOf<AllScopes>();
    expectTypeOf<'faction_inv_planets_assign'>().toMatchTypeOf<AllScopes>();
  });

  it('returns complete helper scope lists without omitting overview scopes', () => {
    expect(getAllCharacterScopes()).toEqual(Object.values(expectedCharacterScopes));
    expect(getAllMessageScopes()).toEqual(Object.values(expectedMessageScopes));
    expect(getAllFactionScopes()).toEqual(Object.values(expectedFactionScopes));
    expect(getAllPersonalInventoryScopes()).toEqual(flattenInventoryScopes(expectedPersonalInventoryScopes));
    expect(getAllFactionInventoryScopes()).toEqual(flattenInventoryScopes(expectedFactionInventoryScopes));

    expect(getAllScopes()).toEqual([
      ...Object.values(expectedCharacterScopes),
      ...Object.values(expectedMessageScopes),
      ...flattenInventoryScopes(expectedPersonalInventoryScopes),
      ...Object.values(expectedFactionScopes),
      ...flattenInventoryScopes(expectedFactionInventoryScopes),
    ]);
  });

  it('keeps curated minimal and read-only helpers stable', () => {
    expect(getMinimalScopes()).toEqual([CharacterScopes.AUTH, CharacterScopes.READ]);

    expect(getReadOnlyScopes()).toEqual([
      CharacterScopes.READ,
      CharacterScopes.STATS,
      CharacterScopes.PRIVILEGES,
      CharacterScopes.SKILLS,
      CharacterScopes.CREDITS,
      CharacterScopes.FORCE,
      CharacterScopes.LOCATION,
      CharacterScopes.EVENTS,
      MessageScopes.READ,
      PersonalInventoryScopes.OVERVIEW,
      FactionScopes.READ,
      FactionScopes.MEMBERS,
      FactionInventoryScopes.OVERVIEW,
    ]);
  });
});
