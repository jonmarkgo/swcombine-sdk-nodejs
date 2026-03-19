/**
 * OAuth Scopes for SW Combine API
 *
 * This module defines all available OAuth scopes and provides utilities
 * for requesting common scope combinations. Scope values mirror the
 * permission names returned by the API permissions catalog.
 *
 * @see https://www.swcombine.com/ws/developers/permissions/
 */

/**
 * Character-related scopes
 */
export const CharacterScopes = {
  /** Solely provides the character name and ID for use by clients who want to verify a character's identity */
  AUTH: 'character_auth',
  /** Read basic character information.<br/>If your profile is private, this will return unique ID, handle, and image.<br/>If your profile is not private, this will also return your race, gender, last login, description, and biography. */
  READ: 'character_read',
  /** Read information about the character's HP and XP */
  STATS: 'character_stats',
  /** Read character privileges */
  PRIVILEGES: 'character_privileges',
  /** Read character skills */
  SKILLS: 'character_skills',
  /** Read character credit information */
  CREDITS: 'character_credits',
  /** Transfer character credits */
  CREDITS_WRITE: 'character_credits_write',
  /** Read character force-related information.<br/>If you are Force-aware, this will return Master or Student where applicable, as well as FP, FXP, regen rate, and Force Meter. */
  FORCE: 'character_force',
  /** Read your location in-game */
  LOCATION: 'character_location',
  /** Read the characters' events */
  EVENTS: 'character_events',
  /** Access all character information */
  ALL: 'character_all',
} as const;

/**
 * Message-related scopes
 */
export const MessageScopes = {
  /** Read messages sent to or by the character */
  READ: 'messages_read',
  /** Send messages to or from the character */
  SEND: 'messages_send',
  /** Delete messages to or from the character */
  DELETE: 'messages_delete',
  /** Read, send and delete messages to or from the character */
  ALL: 'messages_all',
} as const;

/**
 * Personal inventory scopes
 */
export const PersonalInventoryScopes = {
  /** Read basic information about your inventories */
  OVERVIEW: 'personal_inv_overview',

  /** Personal ship scopes */
  SHIPS: {
    /** Read basic information about your ships */
    READ: 'personal_inv_ships_read',
    /** Rename your ships */
    RENAME: 'personal_inv_ships_rename',
    /** Assign your ships */
    ASSIGN: 'personal_inv_ships_assign',
    /** Make over your ships */
    MAKEOVER: 'personal_inv_ships_makeover',
    /** Read the tags assigned to your ships */
    TAGS_READ: 'personal_inv_ships_tags_read',
    /** Modify the tags assigned to your ships */
    TAGS_WRITE: 'personal_inv_ships_tags_write',
    /** Access and change anything in your ship inventory */
    ALL: 'personal_inv_ships_all',
  },

  /** Personal vehicle scopes */
  VEHICLES: {
    /** Read basic information about your vehicles */
    READ: 'personal_inv_vehicles_read',
    /** Rename your vehicles */
    RENAME: 'personal_inv_vehicles_rename',
    /** Assign your vehicles */
    ASSIGN: 'personal_inv_vehicles_assign',
    /** Make over your vehicles */
    MAKEOVER: 'personal_inv_vehicles_makeover',
    /** Read the tags assigned to your vehicles */
    TAGS_READ: 'personal_inv_vehicles_tags_read',
    /** Modify the tags assigned to your vehicles */
    TAGS_WRITE: 'personal_inv_vehicles_tags_write',
    /** Access and change anything in your vehicle inventory */
    ALL: 'personal_inv_vehicles_all',
  },

  /** Personal station scopes */
  STATIONS: {
    /** Read basic information about your space stations */
    READ: 'personal_inv_stations_read',
    /** Rename your space stations */
    RENAME: 'personal_inv_stations_rename',
    /** Assign your space stations */
    ASSIGN: 'personal_inv_stations_assign',
    /** Make over your space stations */
    MAKEOVER: 'personal_inv_stations_makeover',
    /** Read the tags assigned to your space stations */
    TAGS_READ: 'personal_inv_stations_tags_read',
    /** Modify the tags assigned to your space stations */
    TAGS_WRITE: 'personal_inv_stations_tags_write',
    /** Access and change anything in your space station inventory */
    ALL: 'personal_inv_stations_all',
  },

  /** Personal city scopes */
  CITIES: {
    /** Read basic information about your cities */
    READ: 'personal_inv_cities_read',
    /** Rename your cities */
    RENAME: 'personal_inv_cities_rename',
    /** Assign your cities */
    ASSIGN: 'personal_inv_cities_assign',
    /** Make over your cities */
    MAKEOVER: 'personal_inv_cities_makeover',
    /** Read the tags assigned to your cities */
    TAGS_READ: 'personal_inv_cities_tags_read',
    /** Modify the tags assigned to your cities */
    TAGS_WRITE: 'personal_inv_cities_tags_write',
    /** Access and change anything in your city inventory */
    ALL: 'personal_inv_cities_all',
  },

  /** Personal facility scopes */
  FACILITIES: {
    /** Read basic information about your facilities */
    READ: 'personal_inv_facilities_read',
    /** Rename your facilities */
    RENAME: 'personal_inv_facilities_rename',
    /** Assign your facilities */
    ASSIGN: 'personal_inv_facilities_assign',
    /** Make over your facilities */
    MAKEOVER: 'personal_inv_facilities_makeover',
    /** Read the tags assigned to your facilities */
    TAGS_READ: 'personal_inv_facilities_tags_read',
    /** Modify the tags assigned to your facilities */
    TAGS_WRITE: 'personal_inv_facilities_tags_write',
    /** Access and change anything in your facility inventory */
    ALL: 'personal_inv_facilities_all',
  },

  /** Personal planet scopes (no RENAME/MAKEOVER) */
  PLANETS: {
    /** Read basic information about your planets */
    READ: 'personal_inv_planets_read',
    /** Assign your planets */
    ASSIGN: 'personal_inv_planets_assign',
    /** Read the tags assigned to your planets */
    TAGS_READ: 'personal_inv_planets_tags_read',
    /** Modify the tags assigned to your planets */
    TAGS_WRITE: 'personal_inv_planets_tags_write',
    /** Access and change anything in your planet inventory */
    ALL: 'personal_inv_planets_all',
  },

  /** Personal item scopes */
  ITEMS: {
    /** Read basic information about your items */
    READ: 'personal_inv_items_read',
    /** Rename your items */
    RENAME: 'personal_inv_items_rename',
    /** Assign your items */
    ASSIGN: 'personal_inv_items_assign',
    /** Make over your items */
    MAKEOVER: 'personal_inv_items_makeover',
    /** Read the tags assigned to your items */
    TAGS_READ: 'personal_inv_items_tags_read',
    /** Modify the tags assigned to your items */
    TAGS_WRITE: 'personal_inv_items_tags_write',
    /** Access and change anything in your item inventory */
    ALL: 'personal_inv_items_all',
  },

  /** Personal NPC scopes (has MAKEOVER but no RENAME) */
  NPCS: {
    /** Read basic information about your NPCs */
    READ: 'personal_inv_npcs_read',
    /** Assign your NPCs */
    ASSIGN: 'personal_inv_npcs_assign',
    /** Make over your NPCs */
    MAKEOVER: 'personal_inv_npcs_makeover',
    /** Read the tags assigned to your NPCs */
    TAGS_READ: 'personal_inv_npcs_tags_read',
    /** Modify the tags assigned to your NPCs */
    TAGS_WRITE: 'personal_inv_npcs_tags_write',
    /** Access and change anything in your NPC inventory */
    ALL: 'personal_inv_npcs_all',
  },

  /** Personal droid scopes */
  DROIDS: {
    /** Read basic information about your droids */
    READ: 'personal_inv_droids_read',
    /** Rename your droids */
    RENAME: 'personal_inv_droids_rename',
    /** Assign your droids */
    ASSIGN: 'personal_inv_droids_assign',
    /** Make over your droids */
    MAKEOVER: 'personal_inv_droids_makeover',
    /** Read the tags assigned to your droids */
    TAGS_READ: 'personal_inv_droids_tags_read',
    /** Modify the tags assigned to your droids */
    TAGS_WRITE: 'personal_inv_droids_tags_write',
    /** Access and change anything in your droid inventory */
    ALL: 'personal_inv_droids_all',
  },

  /** Personal material scopes (no ASSIGN) */
  MATERIALS: {
    /** Read basic information about your materials */
    READ: 'personal_inv_materials_read',
    /** Rename your materials */
    RENAME: 'personal_inv_materials_rename',
    /** Make over your materials */
    MAKEOVER: 'personal_inv_materials_makeover',
    /** Read the tags assigned to your materials */
    TAGS_READ: 'personal_inv_materials_tags_read',
    /** Modify the tags assigned to your materials */
    TAGS_WRITE: 'personal_inv_materials_tags_write',
    /** Access and change anything in your material inventory */
    ALL: 'personal_inv_materials_all',
  },

  /** Personal creature scopes */
  CREATURES: {
    /** Read basic information about your creatures */
    READ: 'personal_inv_creatures_read',
    /** Rename your creatures */
    RENAME: 'personal_inv_creatures_rename',
    /** Assign your creatures */
    ASSIGN: 'personal_inv_creatures_assign',
    /** Make over your creatures */
    MAKEOVER: 'personal_inv_creatures_makeover',
    /** Read the tags assigned to your creatures */
    TAGS_READ: 'personal_inv_creatures_tags_read',
    /** Modify the tags assigned to your creatures */
    TAGS_WRITE: 'personal_inv_creatures_tags_write',
    /** Access and change anything in your creature inventory */
    ALL: 'personal_inv_creatures_all',
  },
} as const;

/**
 * Faction management scopes
 */
export const FactionScopes = {
  /** Read basic information about your faction */
  READ: 'faction_read',
  /** See your faction's members list */
  MEMBERS: 'faction_members',
  /** See the stocks your faction owns */
  STOCKS: 'faction_stocks',
  /** See how many credits your faction owns */
  CREDITS_READ: 'faction_credits_read',
  /** Transfer credits on behalf of your faction */
  CREDITS_WRITE: 'faction_credits_write',
  /** See your faction's budgets */
  BUDGETS_READ: 'faction_budgets_read',
  /** Change your faction's budgets */
  BUDGETS_WRITE: 'faction_budgets_write',
  /** See your faction's datacard assignments */
  DATACARDS_READ: 'faction_datacards_read',
  /** Assign or revoke your faction's datacard assignments */
  DATACARDS_WRITE: 'faction_datacards_write',
  /** Access and change anything in your faction */
  ALL: 'faction_all',
} as const;

/**
 * Faction inventory scopes
 */
export const FactionInventoryScopes = {
  /** Read basic information about your faction's inventories */
  OVERVIEW: 'faction_inv_overview',

  /** Faction ship scopes */
  SHIPS: {
    /** Read basic information about your faction's ships */
    READ: 'faction_inv_ships_read',
    /** Rename your faction's ships */
    RENAME: 'faction_inv_ships_rename',
    /** Assign your faction's ships */
    ASSIGN: 'faction_inv_ships_assign',
    /** Make over your faction's ships */
    MAKEOVER: 'faction_inv_ships_makeover',
    /** Read the tags assigned to your faction's ships */
    TAGS_READ: 'faction_inv_ships_tags_read',
    /** Modify the tags assigned to your faction's ships */
    TAGS_WRITE: 'faction_inv_ships_tags_write',
    /** Access and change anything in your faction's ship inventory */
    ALL: 'faction_inv_ships_all',
  },

  /** Faction vehicle scopes */
  VEHICLES: {
    /** Read basic information about your faction's vehicles */
    READ: 'faction_inv_vehicles_read',
    /** Rename your faction's vehicles */
    RENAME: 'faction_inv_vehicles_rename',
    /** Assign your faction's vehicles */
    ASSIGN: 'faction_inv_vehicles_assign',
    /** Make over your faction's vehicles */
    MAKEOVER: 'faction_inv_vehicles_makeover',
    /** Read the tags assigned to your faction's vehicles */
    TAGS_READ: 'faction_inv_vehicles_tags_read',
    /** Modify the tags assigned to your faction's vehicles */
    TAGS_WRITE: 'faction_inv_vehicles_tags_write',
    /** Access and change anything in your faction's vehicle inventory */
    ALL: 'faction_inv_vehicles_all',
  },

  /** Faction station scopes */
  STATIONS: {
    /** Read basic information about your faction's space stations */
    READ: 'faction_inv_stations_read',
    /** Rename your faction's space stations */
    RENAME: 'faction_inv_stations_rename',
    /** Assign your faction's space stations */
    ASSIGN: 'faction_inv_stations_assign',
    /** Make over your faction's space stations */
    MAKEOVER: 'faction_inv_stations_makeover',
    /** Read the tags assigned to your faction's space stations */
    TAGS_READ: 'faction_inv_stations_tags_read',
    /** Modify the tags assigned to your faction's space stations */
    TAGS_WRITE: 'faction_inv_stations_tags_write',
    /** Access and change anything in your faction's space station inventory */
    ALL: 'faction_inv_stations_all',
  },

  /** Faction city scopes */
  CITIES: {
    /** Read basic information about your faction's cities */
    READ: 'faction_inv_cities_read',
    /** Rename your faction's cities */
    RENAME: 'faction_inv_cities_rename',
    /** Assign your faction's cities */
    ASSIGN: 'faction_inv_cities_assign',
    /** Make over your faction's cities */
    MAKEOVER: 'faction_inv_cities_makeover',
    /** Read the tags assigned to your faction's cities */
    TAGS_READ: 'faction_inv_cities_tags_read',
    /** Modify the tags assigned to your faction's cities */
    TAGS_WRITE: 'faction_inv_cities_tags_write',
    /** Access and change anything in your faction's city inventory */
    ALL: 'faction_inv_cities_all',
  },

  /** Faction facility scopes */
  FACILITIES: {
    /** Read basic information about your faction's facilities */
    READ: 'faction_inv_facilities_read',
    /** Rename your faction's facilities */
    RENAME: 'faction_inv_facilities_rename',
    /** Assign your faction's facilities */
    ASSIGN: 'faction_inv_facilities_assign',
    /** Make over your faction's facilities */
    MAKEOVER: 'faction_inv_facilities_makeover',
    /** Read the tags assigned to your faction's facilities */
    TAGS_READ: 'faction_inv_facilities_tags_read',
    /** Modify the tags assigned to your faction's facilities */
    TAGS_WRITE: 'faction_inv_facilities_tags_write',
    /** Access and change anything in your faction's facility inventory */
    ALL: 'faction_inv_facilities_all',
  },

  /** Faction planet scopes (no RENAME/MAKEOVER) */
  PLANETS: {
    /** Read basic information about your faction's planets */
    READ: 'faction_inv_planets_read',
    /** Assign your faction's planets */
    ASSIGN: 'faction_inv_planets_assign',
    /** Read the tags assigned to your faction's planets */
    TAGS_READ: 'faction_inv_planets_tags_read',
    /** Modify the tags assigned to your faction's planets */
    TAGS_WRITE: 'faction_inv_planets_tags_write',
    /** Access and change anything in your faction's planet inventory */
    ALL: 'faction_inv_planets_all',
  },

  /** Faction item scopes */
  ITEMS: {
    /** Read basic information about your faction's items */
    READ: 'faction_inv_items_read',
    /** Rename your faction's items */
    RENAME: 'faction_inv_items_rename',
    /** Assign your faction's items */
    ASSIGN: 'faction_inv_items_assign',
    /** Make over your faction's items */
    MAKEOVER: 'faction_inv_items_makeover',
    /** Read the tags assigned to your faction's items */
    TAGS_READ: 'faction_inv_items_tags_read',
    /** Modify the tags assigned to your faction's items */
    TAGS_WRITE: 'faction_inv_items_tags_write',
    /** Access and change anything in your faction's item inventory */
    ALL: 'faction_inv_items_all',
  },

  /** Faction NPC scopes (has MAKEOVER but no RENAME) */
  NPCS: {
    /** Read basic information about your faction's NPCs */
    READ: 'faction_inv_npcs_read',
    /** Assign your faction's NPCs */
    ASSIGN: 'faction_inv_npcs_assign',
    /** Make over your faction's NPCs */
    MAKEOVER: 'faction_inv_npcs_makeover',
    /** Read the tags assigned to your faction's NPCs */
    TAGS_READ: 'faction_inv_npcs_tags_read',
    /** Modify the tags assigned to your faction's NPCs */
    TAGS_WRITE: 'faction_inv_npcs_tags_write',
    /** Access and change anything in your faction's NPC inventory */
    ALL: 'faction_inv_npcs_all',
  },

  /** Faction droid scopes */
  DROIDS: {
    /** Read basic information about your faction's droids */
    READ: 'faction_inv_droids_read',
    /** Rename your faction's droids */
    RENAME: 'faction_inv_droids_rename',
    /** Assign your faction's droids */
    ASSIGN: 'faction_inv_droids_assign',
    /** Make over your faction's droids */
    MAKEOVER: 'faction_inv_droids_makeover',
    /** Read the tags assigned to your faction's droids */
    TAGS_READ: 'faction_inv_droids_tags_read',
    /** Modify the tags assigned to your faction's droids */
    TAGS_WRITE: 'faction_inv_droids_tags_write',
    /** Access and change anything in your faction's droid inventory */
    ALL: 'faction_inv_droids_all',
  },

  /** Faction material scopes (no ASSIGN) */
  MATERIALS: {
    /** Read basic information about your faction's materials */
    READ: 'faction_inv_materials_read',
    /** Rename your faction's materials */
    RENAME: 'faction_inv_materials_rename',
    /** Make over your faction's materials */
    MAKEOVER: 'faction_inv_materials_makeover',
    /** Read the tags assigned to your faction's materials */
    TAGS_READ: 'faction_inv_materials_tags_read',
    /** Modify the tags assigned to your faction's materials */
    TAGS_WRITE: 'faction_inv_materials_tags_write',
    /** Access and change anything in your faction's material inventory */
    ALL: 'faction_inv_materials_all',
  },

  /** Faction creature scopes */
  CREATURES: {
    /** Read basic information about your faction's creatures */
    READ: 'faction_inv_creatures_read',
    /** Rename your faction's creatures */
    RENAME: 'faction_inv_creatures_rename',
    /** Assign your faction's creatures */
    ASSIGN: 'faction_inv_creatures_assign',
    /** Make over your faction's creatures */
    MAKEOVER: 'faction_inv_creatures_makeover',
    /** Read the tags assigned to your faction's creatures */
    TAGS_READ: 'faction_inv_creatures_tags_read',
    /** Modify the tags assigned to your faction's creatures */
    TAGS_WRITE: 'faction_inv_creatures_tags_write',
    /** Access and change anything in your faction's creature inventory */
    ALL: 'faction_inv_creatures_all',
  },
} as const;

/**
 * All available scopes organized by category
 */
export const Scopes = {
  Character: CharacterScopes,
  Messages: MessageScopes,
  PersonalInventory: PersonalInventoryScopes,
  Faction: FactionScopes,
  FactionInventory: FactionInventoryScopes,
} as const;

/**
 * Type representing any valid scope value
 */
export type ScopeValue = string;

/**
 * Helper function to get all character scopes
 */
export function getAllCharacterScopes(): string[] {
  return Object.values(CharacterScopes);
}

/**
 * Helper function to get all message scopes
 */
export function getAllMessageScopes(): string[] {
  return Object.values(MessageScopes);
}

/**
 * Helper function to get all personal inventory scopes
 */
export function getAllPersonalInventoryScopes(): string[] {
  const scopes: string[] = [PersonalInventoryScopes.OVERVIEW];

  // Add all entity-specific scopes
  Object.entries(PersonalInventoryScopes).forEach(([key, value]) => {
    if (key !== 'OVERVIEW' && typeof value === 'object') {
      scopes.push(...Object.values(value));
    }
  });

  return scopes;
}

/**
 * Helper function to get all faction scopes
 */
export function getAllFactionScopes(): string[] {
  return Object.values(FactionScopes);
}

/**
 * Helper function to get all faction inventory scopes
 */
export function getAllFactionInventoryScopes(): string[] {
  const scopes: string[] = [FactionInventoryScopes.OVERVIEW];

  // Add all entity-specific scopes
  Object.entries(FactionInventoryScopes).forEach(([key, value]) => {
    if (key !== 'OVERVIEW' && typeof value === 'object') {
      scopes.push(...Object.values(value));
    }
  });

  return scopes;
}

/**
 * Get all available scopes (for comprehensive testing)
 */
export function getAllScopes(): string[] {
  return [
    ...getAllCharacterScopes(),
    ...getAllMessageScopes(),
    ...getAllPersonalInventoryScopes(),
    ...getAllFactionScopes(),
    ...getAllFactionInventoryScopes(),
  ];
}

/**
 * Get basic read-only scopes (good for read-only integrations)
 */
export function getReadOnlyScopes(): string[] {
  return [
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
  ];
}

/**
 * Get minimal scopes for basic character info (authentication only)
 */
export function getMinimalScopes(): string[] {
  return [CharacterScopes.AUTH, CharacterScopes.READ];
}
