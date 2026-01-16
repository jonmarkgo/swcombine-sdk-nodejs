/**
 * Core types and interfaces for SW Combine SDK
 */

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Type for query parameters (for pagination, filtering, etc.)
 * Supports primitive values and arrays for filtering
 */
export type QueryParams = Record<string, string | number | boolean | string[] | number[] | undefined>;

// ============================================================================
// Enums
// ============================================================================

export enum GrantType {
  AuthorizationCode = 'authorization_code',
  RefreshToken = 'refresh_token',
}

export enum AccessType {
  Online = 'online',
  Offline = 'offline',
}

export enum MessageMode {
  Sent = 'sent',
  Received = 'received',
}

// ============================================================================
// Configuration
// ============================================================================

export interface ClientConfig {
  /** OAuth client ID */
  clientId: string;
  /** OAuth client secret */
  clientSecret: string;
  /** OAuth redirect URI */
  redirectUri?: string;
  /** Access type: online or offline (offline provides refresh token) */
  accessType?: AccessType;
  /** Existing token to initialize with */
  token?: string | OAuthToken;
  /** Base URL for API (default: https://www.swcombine.com/ws/v2.0/) */
  baseURL?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Delay between retries in milliseconds (default: 1000) */
  retryDelay?: number;
  /** Enable debug logging */
  debug?: boolean;
}

// ============================================================================
// OAuth Types
// ============================================================================

export interface OAuthToken {
  /** Access token for API requests */
  accessToken: string;
  /** Refresh token for getting new access token */
  refreshToken?: string;
  /** Token expiration timestamp (milliseconds since epoch) */
  expiresAt: number;
}

export interface OAuthAuthorizationOptions {
  /** OAuth scopes to request */
  scopes: string[];
  /** State parameter for CSRF protection */
  state: string;
}

export interface OAuthCallbackQuery {
  /** Authorization code from callback */
  code?: string;
  /** Error from callback */
  error?: string;
  /** Error description */
  error_description?: string;
  /** State parameter echoed back */
  state?: string;
}

export interface AuthorizationResult {
  /** Whether authorization was successful */
  success: boolean;
  /** OAuth token if successful */
  token?: OAuthToken;
  /** Error message if failed */
  error?: string;
  /** State parameter from request */
  state?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface Character {
  uid: string;
  handle: string;
  name: string;
  race?: string;
  faction?: Faction | string;
  credits?: number;
  location?: Location;
  [key: string]: unknown; // Allow for unknown fields
}

export interface Faction {
  uid: string;
  name: string;
  type?: string;
  owner?: Character | string;
  [key: string]: unknown;
}

export interface Message {
  uid: string;
  subject: string;
  sender: Character | string;
  recipient: Character | string;
  timestamp: string;
  read: boolean;
  body?: string;
  [key: string]: unknown;
}

export interface Skill {
  uid: string;
  name: string;
  level: number;
  experience?: number;
  [key: string]: unknown;
}

export interface CreditLogEntry {
  attributes: {
    transaction_id: number;
  };
  time: {
    years: number;
    days: number;
    hours: number;
    mins: number;
    secs: number;
    timestamp: string;
  };
  amount: number;
  sender: {
    attributes?: {
      uid: string;
      href?: string;
    };
    value?: string;
  };
  receiver: {
    attributes?: {
      uid: string;
      href?: string;
    };
    value?: string;
  };
  communication: string;
  [key: string]: unknown;
}

export interface Planet {
  uid: string;
  name: string;
  sector?: Sector | string;
  system?: System | string;
  size?: string;
  terrain?: string;
  [key: string]: unknown;
}

export interface Sector {
  uid: string;
  name: string;
  [key: string]: unknown;
}

export interface System {
  uid: string;
  name: string;
  sector?: Sector | string;
  [key: string]: unknown;
}

export interface Station {
  uid: string;
  name: string;
  system?: System | string;
  [key: string]: unknown;
}

export interface City {
  uid: string;
  name: string;
  planet?: Planet | string;
  [key: string]: unknown;
}

export interface Location {
  x?: number;
  y?: number;
  z?: number;
  system?: System | string;
  planet?: Planet | string;
  city?: City | string;
  [key: string]: unknown;
}

export interface Entity {
  uid: string;
  type: string;
  name?: string;
  owner?: Character | Faction | string;
  [key: string]: unknown;
}

export interface Vendor {
  uid: string;
  name: string;
  owner?: Character | Faction | string;
  location?: Location;
  [key: string]: unknown;
}

export interface NewsItem {
  uid: string;
  title: string;
  category?: string;
  timestamp: string;
  content?: string;
  [key: string]: unknown;
}

export interface Event {
  uid: string;
  type: string;
  timestamp: string;
  description?: string;
  [key: string]: unknown;
}

// ============================================================================
// List Response Wrapper
// ============================================================================

export interface ListResponse<T> {
  data: T[];
  total?: number;
  page?: number;
  hasMore?: boolean;
}

// ============================================================================
// Rate Limit Types
// ============================================================================

/**
 * Rate limit information returned from API responses.
 * The SW Combine API has a default limit of 600 requests per hour.
 */
export interface RateLimitInfo {
  /** Maximum requests allowed per hour (typically 600) */
  limit: number;
  /** Requests remaining in current window */
  remaining: number;
  /** Unix timestamp when the rate limit resets */
  reset: number;
  /** Human-readable reset time string */
  resetTime: string;
}

// ============================================================================
// API Error Response
// ============================================================================

export interface APIErrorResponse {
  error: string;
  error_description?: string;
  message?: string;
  [key: string]: unknown;
}

// ============================================================================
// Inventory Filter Types
// ============================================================================

/**
 * Valid filter types for inventory entity queries.
 * These can be used with filter_type parameter when listing inventory entities.
 */
export type InventoryFilterType =
  | 'class'
  | 'city'
  | 'name'
  | 'planet'
  | 'sector'
  | 'system'
  | 'type'
  | 'underconstruction'
  | 'opento'
  | 'protected'
  | 'infotext'
  | 'wreck'
  | 'owner'
  | 'commander'
  | 'pilot'
  | 'id'
  | 'powered'
  | 'debt'
  | 'deposit'
  | 'cargocontaineritems'
  | 'cargocontainerdroids'
  | 'container'
  | 'gender'
  | 'working'
  | 'level'
  | 'race'
  | 'tags';

/**
 * Filter inclusion mode for inventory queries.
 */
export type InventoryFilterInclusion = 'includes' | 'excludes';

// ============================================================================
// Inventory Entity Types
// ============================================================================

/**
 * Valid entity types for inventory queries.
 */
export type InventoryEntityType =
  | 'ships'
  | 'vehicles'
  | 'stations'
  | 'cities'
  | 'facilities'
  | 'planets'
  | 'items'
  | 'npcs'
  | 'droids'
  | 'creatures'
  | 'materials';

/**
 * Valid assignment types for inventory queries.
 */
export type InventoryAssignType = 'owner' | 'commander' | 'pilot';

/**
 * Reference to another entity (character, faction, ship, etc.)
 */
export interface EntityReference {
  value: string;
  attributes: {
    uid: string;
    type: string;
    href: string;
  };
}

/**
 * Entity image URLs
 */
export interface EntityImages {
  small: string;
  large: string;
  customsmall: string;
  customlarge: string;
}

/**
 * Entity stat with current value and max
 */
export interface EntityStat {
  value: number;
  attributes: { max: number };
}

/**
 * Entity type reference (ship type, droid type, etc.)
 */
export interface EntityTypeRef {
  value: string;
  attributes: {
    uid: string;
    href: string;
  };
}

/**
 * Coordinate set with galaxy, system, surface, and ground positions
 * Fields are optional to guard against unpredictable API responses.
 */
export interface EntityCoordinates {
  galaxy?: { attributes?: { x: number; y: number } | null };
  system?: { attributes?: { x: string; y: string } | null };
  surface?: { attributes?: { x: number; y: number } | null };
  ground?: { attributes?: { x: number; y: number } | null };
}

/**
 * Entity location information
 * Fields are optional to guard against unpredictable API responses.
 */
export interface EntityLocation {
  container?: EntityReference | Record<string, never>;
  sector?: EntityReference | Record<string, never>;
  system?: EntityReference | Record<string, never>;
  planet?: EntityReference | Record<string, never>;
  city?: EntityReference | Record<string, never>;
  coordinates?: EntityCoordinates;
}

/**
 * Entity tags collection
 */
export interface EntityTags {
  tag: string[];
}

/**
 * Ship entity value (inner data)
 * Most fields are optional to guard against unpredictable API responses.
 */
export interface ShipEntityValue {
  uid: string;
  entitytype?: 'Ship';
  name?: string;
  owner?: EntityReference;
  pilot?: EntityReference;
  infotext?: string;
  images?: EntityImages;
  opento?: string;
  protected?: 'yes' | 'no';
  wrecked?: 'yes' | 'no';
  hull?: EntityStat;
  shield?: EntityStat;
  ionic?: EntityStat;
  location?: EntityLocation;
  type?: EntityTypeRef;
  underconstruction?: 'yes' | 'no';
  tags?: EntityTags;
}

/**
 * Ship entity (wrapper with href attribute)
 */
export interface ShipEntity {
  attributes: { href: string };
  value: ShipEntityValue;
}

/**
 * Droid entity value (inner data)
 * Most fields are optional to guard against unpredictable API responses.
 */
export interface DroidEntityValue {
  uid: string;
  entitytype?: 'Droid';
  name?: string;
  owner?: EntityReference;
  commander?: EntityReference;
  pilot?: EntityReference;
  infotext?: string;
  images?: EntityImages;
  protected?: 'yes' | 'no';
  wrecked?: 'yes' | 'no';
  hull?: EntityStat;
  shield?: EntityStat;
  ionic?: EntityStat;
  location?: EntityLocation;
  type?: EntityTypeRef;
  tags?: EntityTags;
}

/**
 * Droid entity (wrapper with href attribute)
 */
export interface DroidEntity {
  attributes: { href: string };
  value: DroidEntityValue;
}

/**
 * Facility entity value (inner data)
 * Most fields are optional to guard against unpredictable API responses.
 */
export interface FacilityEntityValue {
  uid: string;
  entitytype?: 'Facility';
  name?: string;
  owner?: EntityReference;
  commander?: EntityReference;
  pilot?: EntityReference;
  infotext?: string;
  images?: EntityImages;
  opento?: string;
  protected?: 'yes' | 'no';
  wrecked?: 'yes' | 'no';
  hull?: EntityStat;
  shield?: EntityStat;
  ionic?: EntityStat;
  location?: EntityLocation;
  type?: EntityTypeRef;
  ispowered?: string;
  poweredby?: { pg?: EntityReference[] };
  orientation?: string;
  underconstruction?: 'yes' | 'no';
  tags?: EntityTags;
}

/**
 * Facility entity (wrapper with href attribute)
 */
export interface FacilityEntity {
  attributes: { href: string };
  value: FacilityEntityValue;
}

/**
 * Item entity value (inner data)
 * Most fields are optional to guard against unpredictable API responses.
 */
export interface ItemEntityValue {
  uid: string;
  entitytype?: 'Item';
  name?: string;
  owner?: EntityReference;
  infotext?: string;
  images?: EntityImages;
  protected?: 'yes' | 'no';
  location?: EntityLocation;
  type?: EntityTypeRef;
  tags?: EntityTags;
}

/**
 * Item entity (wrapper with href attribute)
 */
export interface ItemEntity {
  attributes: { href: string };
  value: ItemEntityValue;
}

/**
 * Material entity value (inner data)
 * Most fields are optional to guard against unpredictable API responses.
 */
export interface MaterialEntityValue {
  uid: string;
  entitytype?: 'Material';
  name?: string;
  owner?: EntityReference;
  infotext?: string;
  images?: EntityImages;
  protected?: 'yes' | 'no';
  location?: EntityLocation;
  quantity?: number;
  type?: EntityTypeRef;
  tags?: EntityTags;
}

/**
 * Material entity (wrapper with href attribute)
 */
export interface MaterialEntity {
  attributes: { href: string };
  value: MaterialEntityValue;
}

/**
 * Generic inventory entity value (fallback for untyped entity types)
 */
export interface GenericInventoryEntityValue {
  uid: string;
  entitytype: string;
  name: string;
  owner?: EntityReference;
  [key: string]: unknown;
}

/**
 * Generic inventory entity (wrapper with href attribute)
 */
export interface GenericInventoryEntity {
  attributes: { href: string };
  value: GenericInventoryEntityValue;
}

/**
 * Type map for inventory entity types to their corresponding interfaces
 */
export interface InventoryEntityTypeMap {
  ships: ShipEntity;
  droids: DroidEntity;
  facilities: FacilityEntity;
  items: ItemEntity;
  materials: MaterialEntity;
  vehicles: GenericInventoryEntity;
  stations: GenericInventoryEntity;
  cities: GenericInventoryEntity;
  planets: GenericInventoryEntity;
  npcs: GenericInventoryEntity;
  creatures: GenericInventoryEntity;
}

// ============================================================================
// Request Options Types
// ============================================================================

export interface GetCharacterOptions {
  uid: string;
}

export interface GetCharacterByHandleOptions {
  handle: string;
}

export interface ListMessagesOptions {
  uid: string;
  /** Message mode: 'sent' or 'received'. If omitted, returns both sent and received messages. */
  mode?: MessageMode;
  start_index?: number;
  item_count?: number;
}

export interface GetMessageOptions {
  uid: string;
  messageId: string;
}

export interface DeleteMessageOptions {
  uid: string;
  messageId: string;
}

export interface CreateMessageOptions {
  uid: string;
  /** Semicolon-separated list of recipient character names/UIDs (max 25) */
  receivers: string;
  /** Message text content */
  communication: string;
}

export interface GetCharacterSkillsOptions {
  uid: string;
}

export interface GetCharacterPrivilegesOptions {
  uid: string;
}

export interface GetCharacterCreditsOptions {
  uid: string;
}

export interface GetCharacterCreditlogOptions {
  uid: string;
  /** Starting position for pagination (1-based). Default: 1 */
  start_index?: number;
  /** Number of items to retrieve. Default: 50, Max: 1000 */
  item_count?: number;
  /** Oldest transaction ID threshold (1 = oldest 1000, 0/default = newest 1000) */
  start_id?: number;
}

export interface GetCharacterPermissionsOptions {
  uid: string;
}

export interface GetFactionOptions {
  /** Faction UID. If omitted, defaults to the authenticated user's primary faction. */
  uid?: string;
}

export interface ListFactionMembersOptions {
  factionId: string;
}

export interface GetFactionBudgetOptions {
  uid: string;
  budgetId: string;
}

export interface GetFactionCreditsOptions {
  uid: string;
}

export interface GetPlanetOptions {
  uid: string;
}

export interface GetSectorOptions {
  uid: string;
}

export interface GetSystemOptions {
  uid: string;
}

export interface GetStationOptions {
  uid: string;
}

export interface GetCityOptions {
  uid: string;
}

export interface GetVendorOptions {
  uid: string;
}

export interface GetNewsItemOptions {
  id: string;
}

/**
 * Base news listing options (shared between GNS and SimNews)
 */
export interface ListNewsOptionsBase {
  /** News category to filter by */
  category?: string;
  /** Starting position (1-based). Default: 1 */
  start_index?: number;
  /** Number of items to retrieve. Default: 50, Max: 50 */
  item_count?: number;
  /** Filter news starting from this Unix timestamp */
  start_date?: number;
  /** Filter news up to this Unix timestamp */
  end_date?: number;
  /** Search term to filter by */
  search?: string;
  /** Author name to filter by */
  author?: string;
}

/**
 * GNS (Galactic News Service) listing options
 * Extends base options with GNS-specific faction filtering
 */
export interface ListGNSOptions extends ListNewsOptionsBase {
  /** Faction name to filter by (GNS only) */
  faction?: string;
  /** Faction type to filter by (GNS only) */
  faction_type?: string;
}

/**
 * SimNews listing options
 * Uses only base options (no faction filtering)
 */
export interface ListSimNewsOptions extends ListNewsOptionsBase {}

/**
 * @deprecated Use ListGNSOptions or ListSimNewsOptions instead.
 * This combined type is kept for backwards compatibility.
 */
export interface ListNewsOptions extends ListGNSOptions {}

export interface GetEntityOptions {
  entityType: string;
  uid: string;
}

export interface ListInventoryEntitiesOptions<T extends InventoryEntityType = InventoryEntityType> {
  uid: string;
  /** Entity type: 'ships', 'vehicles', 'stations', 'cities', 'facilities', 'planets', 'items', 'npcs', 'droids', 'creatures', or 'materials' */
  entityType: T;
  /** Assignment type: 'owner', 'commander', or 'pilot' */
  assignType: InventoryAssignType;
  /** Starting position for pagination (1-based). Default: 1 */
  start_index?: number;
  /** Number of items to retrieve. Default: 50, Max: 200 */
  item_count?: number;
  /** Filter types to apply to the query */
  filter_type?: InventoryFilterType[];
  /** Values corresponding to each filter type */
  filter_value?: string[];
  /** Whether each filter should include or exclude matches. Default: 'includes' */
  filter_inclusion?: InventoryFilterInclusion[];
}
