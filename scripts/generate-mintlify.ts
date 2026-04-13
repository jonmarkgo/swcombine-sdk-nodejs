#!/usr/bin/env tsx
/**
 * Generate Mintlify-compatible MDX resource pages from TypeDoc markdown output.
 *
 * Reads docs/api/resources/ and docs/api/types/interfaces/ to produce
 * mintlify/resources/*.mdx files with <ParamField>, code examples, and
 * auth requirement callouts.
 *
 * Requires: npm run docs:api to have been run first (populates docs/api/).
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DOCS_API = join(ROOT, 'docs', 'api');
const MINTLIFY_RESOURCES = join(ROOT, 'mintlify', 'resources');

// ---------------------------------------------------------------------------
// Resource configuration
// ---------------------------------------------------------------------------

interface RelatedCard {
  title: string;
  icon: string;
  href: string;
  description: string;
}

interface ResourceConfig {
  /** Output filename without extension */
  name: string;
  /** TypeDoc directory name under docs/api/resources/ */
  dir: string;
  /** Page title */
  title: string;
  /** Page description for frontmatter */
  description: string;
  /** SEO keywords */
  keywords: string[];
  /** Intro paragraph */
  intro: string;
  /** Optional notes to show after intro */
  notes?: string[];
  /** Client accessor path (e.g., 'client.character') */
  accessor: string;
  /** Main class name */
  mainClass: string;
  /** Sub-resource display config: maps class name → section label + accessor prefix */
  subResources?: Record<string, { label: string; accessor: string }>;
  /** Related resource cards */
  related?: RelatedCard[];
}

const RESOURCES: ResourceConfig[] = [
  {
    name: 'character',
    dir: 'CharacterResource',
    title: 'Character',
    description:
      'Use client.character to fetch character profiles, send and receive messages, manage credits, query skills, and inspect OAuth privileges and permissions.',
    keywords: [
      'swcombine sdk',
      'character',
      'messages',
      'credits',
      'skills',
      'privileges',
      'permissions',
      'CHARACTER_READ',
    ],
    intro:
      'The `client.character` resource gives you access to the core player identity in the Star Wars Combine universe. You can look up characters by UID or handle, read the authenticated user\'s own profile, exchange in-game messages, transfer credits, and inspect the fine-grained privilege and permission system.',
    accessor: 'client.character',
    mainClass: 'CharacterResource',
    subResources: {
      CharacterMessagesResource: { label: 'Messages', accessor: 'character.messages' },
      CharacterSkillsResource: { label: 'Skills', accessor: 'character.skills' },
      CharacterCreditsResource: { label: 'Credits', accessor: 'character.credits' },
      CharacterCreditlogResource: { label: 'Credit Log', accessor: 'character.creditlog' },
      CharacterPrivilegesResource: { label: 'Privileges', accessor: 'character.privileges' },
      CharacterPermissionsResource: { label: 'Permissions', accessor: 'character.permissions' },
    },
    related: [
      { title: 'Faction', icon: 'flag', href: '/resources/faction', description: 'Access faction membership, budgets, and credit logs.' },
      { title: 'Inventory', icon: 'box', href: '/resources/inventory', description: 'List and manage entities owned or piloted by a character.' },
      { title: 'Events', icon: 'bolt', href: '/resources/events', description: 'Query the event log for character activity.' },
      { title: 'Authentication scopes', icon: 'lock', href: '/authentication/scopes', description: 'See the full list of OAuth scopes and what they unlock.' },
    ],
  },
  {
    name: 'faction',
    dir: 'FactionResource',
    title: 'Faction',
    description:
      'Use client.faction to retrieve faction details, list members, manage budgets and stockholders, and query credit logs.',
    keywords: ['swcombine sdk', 'faction', 'members', 'budgets', 'stockholders', 'credits', 'FACTION_READ'],
    intro:
      'The `client.faction` resource provides access to faction data including membership rosters, budgets, stockholder lists, and credit transaction history.',
    accessor: 'client.faction',
    mainClass: 'FactionResource',
    subResources: {
      FactionMembersResource: { label: 'Members', accessor: 'faction.members' },
      FactionBudgetsResource: { label: 'Budgets', accessor: 'faction.budgets' },
      FactionStockholdersResource: { label: 'Stockholders', accessor: 'faction.stockholders' },
      FactionCreditsResource: { label: 'Credits', accessor: 'faction.credits' },
      FactionCreditlogResource: { label: 'Credit Log', accessor: 'faction.creditlog' },
    },
    related: [
      { title: 'Character', icon: 'user', href: '/resources/character', description: 'Access character profiles and their faction associations.' },
      { title: 'Inventory', icon: 'box', href: '/resources/inventory', description: 'List entities owned by a faction.' },
    ],
  },
  {
    name: 'galaxy',
    dir: 'GalaxyResource',
    title: 'Galaxy',
    description:
      'Use client.galaxy to paginate through all star systems, planets, sectors, stations, and cities in the Star Wars Combine galaxy map.',
    keywords: ['swcombine sdk', 'galaxy', 'systems', 'planets', 'sectors', 'stations', 'cities', 'galaxy map'],
    intro:
      'The `client.galaxy` resource provides read access to the physical map of the Star Wars Combine galaxy. Every sub-resource — systems, planets, sectors, stations, and cities — returns a `Page<T>` and supports the standard `start_index` / `item_count` pagination parameters and `for await...of` auto-pagination.',
    notes: [
      'Some galaxy sub-resources (notably sectors) return a `404` if you omit pagination parameters entirely. Always pass explicit `start_index` and `item_count` values when calling these endpoints.',
    ],
    accessor: 'client.galaxy',
    mainClass: 'GalaxyResource',
    subResources: {
      GalaxySystemsResource: { label: 'Star Systems', accessor: 'galaxy.systems' },
      GalaxyPlanetsResource: { label: 'Planets', accessor: 'galaxy.planets' },
      GalaxySectorsResource: { label: 'Sectors', accessor: 'galaxy.sectors' },
      GalaxyStationsResource: { label: 'Stations', accessor: 'galaxy.stations' },
      GalaxyCitiesResource: { label: 'Cities', accessor: 'galaxy.cities' },
    },
    related: [
      { title: 'Location', icon: 'location-dot', href: '/resources/location', description: 'Look up the current location of any entity.' },
      { title: 'Inventory', icon: 'box', href: '/resources/inventory', description: 'List entities at a given location.' },
    ],
  },
  {
    name: 'inventory',
    dir: 'InventoryResource',
    title: 'Inventory',
    description:
      'Use client.inventory to list and manage entities (ships, vehicles, facilities, etc.) owned or assigned to characters and factions.',
    keywords: ['swcombine sdk', 'inventory', 'entities', 'ships', 'vehicles', 'facilities', 'items'],
    intro:
      'The `client.inventory` resource lets you list and inspect entities — ships, vehicles, facilities, items, NPCs, and more — that belong to your character or faction.',
    accessor: 'client.inventory',
    mainClass: 'InventoryResource',
    subResources: {
      InventoryEntitiesResource: { label: 'Entities', accessor: 'inventory.entities' },
    },
    related: [
      { title: 'Character', icon: 'user', href: '/resources/character', description: 'Access the character who owns or pilots these entities.' },
      { title: 'Types', icon: 'tags', href: '/resources/types', description: 'Look up entity type details and stats.' },
      { title: 'Location', icon: 'location-dot', href: '/resources/location', description: 'Look up entity locations.' },
    ],
  },
  {
    name: 'market',
    dir: 'MarketResource',
    title: 'Market',
    description:
      'Use client.market to browse NPC vendor listings and retrieve item prices in the Star Wars Combine marketplace.',
    keywords: ['swcombine sdk', 'market', 'vendors', 'prices', 'shop', 'marketplace'],
    intro:
      'The `client.market` resource provides access to NPC vendor listings and marketplace data.',
    accessor: 'client.market',
    mainClass: 'MarketResource',
    subResources: {
      MarketVendorsResource: { label: 'Vendors', accessor: 'market.vendors' },
    },
    related: [
      { title: 'Types', icon: 'tags', href: '/resources/types', description: 'Look up entity type details for items on sale.' },
      { title: 'Inventory', icon: 'box', href: '/resources/inventory', description: 'Manage purchased entities.' },
    ],
  },
  {
    name: 'news',
    dir: 'NewsResource',
    title: 'News',
    description:
      'Use client.news to read Galactic News Service (GNS) articles and Sim News posts from the Star Wars Combine universe.',
    keywords: ['swcombine sdk', 'news', 'GNS', 'galactic news', 'sim news'],
    intro:
      'The `client.news` resource provides access to the Galactic News Service (GNS) and Sim News feeds — the in-game news system for the Star Wars Combine.',
    accessor: 'client.news',
    mainClass: 'NewsResource',
    subResources: {
      GNSResource: { label: 'Galactic News Service (GNS)', accessor: 'news.gns' },
      SimNewsResource: { label: 'Sim News', accessor: 'news.simNews' },
    },
    related: [
      { title: 'Events', icon: 'bolt', href: '/resources/events', description: 'Query personal and faction event logs.' },
    ],
  },
  {
    name: 'events',
    dir: 'EventsResource',
    title: 'Events',
    description:
      'Use client.events to query personal, faction, inventory, and combat event logs with filtering and pagination.',
    keywords: ['swcombine sdk', 'events', 'event log', 'personal', 'faction', 'combat', 'inventory'],
    intro:
      'The `client.events` resource lets you query the event log for personal, faction, inventory, and combat events.',
    notes: [
      'The Events endpoint uses **0-based indexing** (`start_index: 0`) unlike all other endpoints which use 1-based indexing.',
    ],
    accessor: 'client.events',
    mainClass: 'EventsResource',
    related: [
      { title: 'Character', icon: 'user', href: '/resources/character', description: 'Access the character whose events you are querying.' },
      { title: 'Faction', icon: 'flag', href: '/resources/faction', description: 'Access faction details for faction events.' },
    ],
  },
  {
    name: 'types',
    dir: 'TypesResource',
    title: 'Types',
    description:
      'Use client.types to browse entity types, classes, and detailed type information across all entity categories.',
    keywords: ['swcombine sdk', 'types', 'entity types', 'classes', 'ships', 'vehicles', 'facilities', 'items'],
    intro:
      'The `client.types` resource provides access to the Star Wars Combine entity type system — categories, classes, and detailed type information for ships, vehicles, facilities, items, and more.',
    accessor: 'client.types',
    mainClass: 'TypesResource',
    subResources: {
      TypesClassesResource: { label: 'Classes', accessor: 'types.classes' },
      TypesEntitiesResource: { label: 'Entity Types', accessor: 'types.entities' },
    },
    related: [
      { title: 'Inventory', icon: 'box', href: '/resources/inventory', description: 'List entities of a given type.' },
      { title: 'Market', icon: 'shop', href: '/resources/market', description: 'Find vendors selling a given type.' },
    ],
  },
  {
    name: 'location',
    dir: 'LocationResource',
    title: 'Location',
    description:
      'Use client.location to look up the current location of any entity in the Star Wars Combine universe.',
    keywords: ['swcombine sdk', 'location', 'entity location', 'coordinates', 'position'],
    intro:
      'The `client.location` resource lets you look up the current location of any entity (character, ship, vehicle, etc.).',
    accessor: 'client.location',
    mainClass: 'LocationResource',
    related: [
      { title: 'Galaxy', icon: 'earth-americas', href: '/resources/galaxy', description: 'Browse systems, planets, and sectors.' },
      { title: 'Inventory', icon: 'box', href: '/resources/inventory', description: 'List entities to find their UIDs.' },
    ],
  },
  {
    name: 'datacard',
    dir: 'DatacardResource',
    title: 'Datacard',
    description:
      'Use client.datacard to manage datacards — production licenses that allow factions to manufacture entities.',
    keywords: ['swcombine sdk', 'datacard', 'datacards', 'production', 'manufacturing'],
    intro:
      'The `client.datacard` resource provides access to datacards — production licenses that control which entity types a faction can manufacture.',
    accessor: 'client.datacard',
    mainClass: 'DatacardResource',
    related: [
      { title: 'Types', icon: 'tags', href: '/resources/types', description: 'Look up entity type details for datacards.' },
      { title: 'Faction', icon: 'flag', href: '/resources/faction', description: 'Access faction details for datacard ownership.' },
    ],
  },
];

// ---------------------------------------------------------------------------
// TypeDoc Markdown Parser
// ---------------------------------------------------------------------------

interface ParsedParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface ParsedMethod {
  name: string;
  description: string;
  authRequired: string | null;
  scope: string | null;
  params: ParsedParam[];
  returnType: string;
  returnDescription: string;
  examples: string[];
}

interface ParsedClass {
  name: string;
  description: string;
  methods: ParsedMethod[];
}

/** Strip TypeDoc breadcrumbs and "Defined in:" lines from markdown. */
function cleanMarkdown(raw: string): string[] {
  const lines = raw.split('\n');
  let start = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('# ')) {
      start = i;
      break;
    }
  }
  return lines.slice(start).filter((l) => !l.trim().startsWith('Defined in:'));
}

/** Extract a clean type string from TypeDoc's escaped markdown. */
function cleanType(raw: string): string {
  // Remove markdown link syntax: [`Type`](path) → Type
  let t = raw.replace(/\[`([^\]]+)`\]\([^)]*\)/g, '$1');
  t = t.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  // Remove backtick-escaped angle brackets
  t = t.replace(/\\</g, '<').replace(/\\>/g, '>');
  // Remove leading > and backticks used for type display
  t = t.replace(/^>\s*/, '').replace(/`/g, '').trim();
  // Remove bold property name prefix: "**name**: type" → "type", "optional **name**: type" → "type"
  t = t.replace(/^optional\s+/, '');
  t = t.replace(/\*\*\w+\*\*:\s*/, '');
  return t;
}

/** Resolve an Options interface file and extract its properties as params. */
function resolveOptionsInterface(interfaceName: string): ParsedParam[] {
  const filePath = join(DOCS_API, 'types', 'interfaces', `${interfaceName}.md`);
  if (!existsSync(filePath)) return [];

  const raw = readFileSync(filePath, 'utf-8');
  const lines = cleanMarkdown(raw);
  const params: ParsedParam[] = [];
  let i = 0;

  // Find ## Properties section
  while (i < lines.length && !lines[i].trim().startsWith('## Properties')) i++;
  i++;

  // Parse each ### property
  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.startsWith('## ') && !line.startsWith('### ')) break;

    if (line.startsWith('### ')) {
      const rawName = line.replace('### ', '').replace(/\\/g, '');
      const isOptional = rawName.endsWith('?');
      const name = rawName.replace(/\?$/, '');
      i++;

      // Find the type line (starts with >)
      let type = 'unknown';
      let description = '';
      while (i < lines.length) {
        const l = lines[i].trim();
        if (l.startsWith('### ') || l.startsWith('## ')) break;
        if (l.startsWith('> ') || l.startsWith('>**') || l.startsWith('>`')) {
          type = cleanType(l);
          i++;
          continue;
        }
        if (l.startsWith('***') || l === '' || l.startsWith('Defined in:')) {
          i++;
          continue;
        }
        // Remaining non-empty lines are description
        if (l && !l.startsWith('#')) {
          description = description ? `${description} ${l}` : l;
        }
        i++;
      }

      params.push({
        name,
        type,
        required: !isOptional,
        description: description.trim(),
      });
    } else {
      i++;
    }
  }

  return params;
}

/** Parse a TypeDoc class markdown file into structured data. */
function parseClassMarkdown(filePath: string): ParsedClass | null {
  if (!existsSync(filePath)) return null;

  const raw = readFileSync(filePath, 'utf-8');
  const lines = cleanMarkdown(raw);
  if (lines.length === 0) return null;

  // Extract class name from heading
  const classNameMatch = lines[0].match(/^# Class:\s*(.+)/);
  if (!classNameMatch) return null;
  const className = classNameMatch[1].trim();

  // Extract class description (lines between class heading and first ## section)
  let description = '';
  let i = 1;
  while (i < lines.length && !lines[i].trim().startsWith('## ')) {
    const l = lines[i].trim();
    if (l && !l.startsWith('Defined in:')) {
      description = description ? `${description} ${l}` : l;
    }
    i++;
  }

  // Find ## Methods section
  while (i < lines.length && !lines[i].trim().startsWith('## Methods')) i++;
  if (i >= lines.length) return { name: className, description: description.trim(), methods: [] };
  i++;

  // Parse methods
  const methods: ParsedMethod[] = [];

  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.startsWith('## ') && !line.startsWith('### ')) break;

    if (line.startsWith('### ') && line.endsWith('()')) {
      const result = parseMethod(lines, i);
      if (result) {
        methods.push(result.method);
        i = result.nextIndex;
      } else {
        i++;
      }
    } else {
      i++;
    }
  }

  return { name: className, description: description.trim(), methods };
}

function parseMethod(
  lines: string[],
  startIndex: number
): { method: ParsedMethod; nextIndex: number } | null {
  let i = startIndex;
  const nameLine = lines[i].trim();
  const name = nameLine.replace('### ', '').replace('()', '').trim();
  i++;

  // Skip signature line (starts with >)
  while (i < lines.length && !lines[i].trim().startsWith('## ') && !lines[i].trim().startsWith('#### ')) {
    i++;
  }

  // Collect description, auth info, and sections
  let description = '';
  let authRequired: string | null = null;
  let scope: string | null = null;
  const params: ParsedParam[] = [];
  let returnType = '';
  let returnDescription = '';
  const examples: string[] = [];

  // Re-scan from after signature to find description text before #### sections
  let descStart = startIndex + 1;
  // Skip blank lines and > signature lines (they can be interleaved)
  while (descStart < lines.length) {
    const trimmed = lines[descStart].trim();
    if (trimmed === '' || trimmed.startsWith('>')) {
      descStart++;
    } else {
      break;
    }
  }

  let descEnd = descStart;
  while (descEnd < lines.length && !lines[descEnd].trim().startsWith('####') && !lines[descEnd].trim().startsWith('### ') && !lines[descEnd].trim().startsWith('***')) {
    descEnd++;
  }

  for (let d = descStart; d < descEnd; d++) {
    const l = lines[d].trim();
    if (l.startsWith('@requires_auth')) {
      authRequired = l.replace('@requires_auth', '').trim() || 'Yes';
    } else if (l.startsWith('@requires_scope')) {
      scope = l.replace('@requires_scope', '').trim();
    } else if (l) {
      description = description ? `${description}\n${l}` : l;
    }
  }

  // Now parse #### sections
  i = descEnd;
  while (i < lines.length) {
    const line = lines[i].trim();

    // Stop at next method or section
    if (line.startsWith('### ') && line !== `### ${name}()`) break;
    if (line === '***') {
      // Check if next non-empty line is a new method
      let peek = i + 1;
      while (peek < lines.length && lines[peek].trim() === '') peek++;
      if (peek < lines.length && lines[peek].trim().startsWith('### ')) {
        i = peek;
        break;
      }
      i++;
      continue;
    }

    if (line === '#### Parameters') {
      i++;
      const result = parseParameters(lines, i);
      params.push(...result.params);
      i = result.nextIndex;
    } else if (line === '#### Returns') {
      i++;
      while (i < lines.length) {
        const l = lines[i].trim();
        if (l.startsWith('####') || l.startsWith('### ') || l === '***') break;
        if (l.startsWith('`') || l.startsWith('Promise') || l.startsWith('[')) {
          returnType = cleanType(l);
        } else if (l) {
          returnDescription = returnDescription ? `${returnDescription} ${l}` : l;
        }
        i++;
      }
    } else if (line === '#### Example' || line === '#### Examples') {
      i++;
      while (i < lines.length) {
        const l = lines[i].trim();
        if (l.startsWith('####') || l.startsWith('### ') || l === '***') break;
        if (l.startsWith('```')) {
          // Collect the full code block
          const codeLines: string[] = [lines[i]];
          i++;
          while (i < lines.length && !lines[i].trim().startsWith('```')) {
            codeLines.push(lines[i]);
            i++;
          }
          if (i < lines.length) codeLines.push(lines[i]); // closing ```
          examples.push(codeLines.join('\n'));
          i++;
        } else {
          i++;
        }
      }
    } else {
      i++;
    }
  }

  return {
    method: {
      name,
      description: description.trim(),
      authRequired,
      scope,
      params,
      returnType,
      returnDescription: returnDescription.trim(),
      examples,
    },
    nextIndex: i,
  };
}

function parseParameters(
  lines: string[],
  startIndex: number
): { params: ParsedParam[]; nextIndex: number } {
  const params: ParsedParam[] = [];
  let i = startIndex;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.startsWith('####') && !line.startsWith('#####')) break;
    if (line.startsWith('### ') || line === '***') break;

    if (line.startsWith('##### ')) {
      const rawName = line.replace('##### ', '').trim();
      const isOptionalByName = rawName.endsWith('?');
      const paramName = rawName.replace(/\?$/, '');
      i++;

      // Check if this is a reference to an options interface or has inline sub-fields
      let type = '';
      let description = '';
      const subParams: ParsedParam[] = [];

      while (i < lines.length) {
        const l = lines[i].trim();
        if (l.startsWith('##### ') || (l.startsWith('#### ') && !l.startsWith('##### ')) || l.startsWith('### ') || l === '***') break;

        if (l.startsWith('###### ')) {
          // Inline sub-field
          const subResult = parseSubField(lines, i);
          subParams.push(subResult.param);
          i = subResult.nextIndex;
        } else if (l.startsWith('[`') && l.includes('Options')) {
          // Reference to options interface
          const match = l.match(/\[`(\w+)`\]/);
          if (match) {
            const resolvedParams = resolveOptionsInterface(match[1]);
            if (resolvedParams.length > 0) {
              params.push(...resolvedParams);
              // Skip to end of this parameter section
              i++;
              while (i < lines.length) {
                const skip = lines[i].trim();
                if (skip.startsWith('#####') || skip.startsWith('####') || skip.startsWith('### ') || skip === '***') break;
                i++;
              }
              break;
            }
          }
          i++;
        } else if ((l.startsWith('`') || l.startsWith('[`')) && !type) {
          type = cleanType(l);
          i++;
        } else if (l && !l.startsWith('Defined in:')) {
          // Description text (may also be a description of the options param itself)
          if (!l.startsWith('[`')) {
            description = description ? `${description} ${l}` : l;
          }
          i++;
        } else {
          i++;
        }
      }

      if (subParams.length > 0) {
        params.push(...subParams);
      } else if (!params.some(p => p.name === paramName) && paramName !== 'options') {
        // Only add if we haven't already resolved from interface
        params.push({
          name: paramName,
          type: type || 'unknown',
          required: !isOptionalByName,
          description: description.trim(),
        });
      }
    } else {
      i++;
    }
  }

  return { params, nextIndex: i };
}

function parseSubField(
  lines: string[],
  startIndex: number
): { param: ParsedParam; nextIndex: number } {
  let i = startIndex;
  const line = lines[i].trim();
  const rawName = line.replace('###### ', '').trim();
  const isOptional = rawName.endsWith('?');
  const name = rawName.replace(/\?$/, '');
  i++;

  let type = '';
  let description = '';

  while (i < lines.length) {
    const l = lines[i].trim();
    if (l.startsWith('######') || l.startsWith('#####') || l.startsWith('####') || l.startsWith('### ') || l === '***') break;

    if ((l.startsWith('`') || l.startsWith('[`')) && !type) {
      type = cleanType(l);
    } else if (l && !l.startsWith('Defined in:')) {
      description = description ? `${description} ${l}` : l;
    }
    i++;
  }

  return {
    param: {
      name,
      type: type || 'unknown',
      required: !isOptional,
      description: description.trim(),
    },
    nextIndex: i,
  };
}

// ---------------------------------------------------------------------------
// MDX Generation
// ---------------------------------------------------------------------------

function generateMethodMdx(method: ParsedMethod, accessorPrefix: string): string {
  const parts: string[] = [];
  const displayName = `${accessorPrefix}.${method.name}()`;

  parts.push(`### ${displayName}`);
  parts.push('');

  if (method.description) {
    parts.push(method.description);
    parts.push('');
  }

  if (method.scope) {
    parts.push(`**Requires:** \`${method.scope}\``);
    parts.push('');
  } else if (method.authRequired) {
    parts.push(`**Requires:** Authentication`);
    parts.push('');
  }

  // Parameters
  for (const param of method.params) {
    const typeAttr = param.type ? ` type="${param.type}"` : '';
    const requiredAttr = param.required ? ' required' : '';
    const defaultMatch = param.description.match(/Default:\s*(\d+)/i);
    const defaultAttr = defaultMatch ? ` default="${defaultMatch[1]}"` : '';

    parts.push(`<ParamField path="${param.name}"${typeAttr}${requiredAttr}${defaultAttr}>`);
    parts.push(`  ${param.description || `The ${param.name} parameter.`}`);
    parts.push(`</ParamField>`);
    parts.push('');
  }

  // Examples
  for (const example of method.examples) {
    // Normalize language tag to typescript
    const normalized = example.replace(/^```ts\b/, '```typescript');
    parts.push(normalized);
    parts.push('');
  }

  return parts.join('\n');
}

function generateResourceMdx(config: ResourceConfig): string {
  const classesDir = join(DOCS_API, 'resources', config.dir, 'classes');
  if (!existsSync(classesDir)) {
    console.warn(`Warning: ${classesDir} not found, skipping ${config.name}`);
    return '';
  }

  const classFiles = readdirSync(classesDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => join(classesDir, f));

  // Parse all classes
  const classes: ParsedClass[] = [];
  for (const file of classFiles) {
    const parsed = parseClassMarkdown(file);
    if (parsed) classes.push(parsed);
  }

  // Find main class and sub-resources
  const mainClass = classes.find((c) => c.name === config.mainClass);
  const subClasses = classes.filter((c) => c.name !== config.mainClass && c.name !== 'BaseResource');

  // Build MDX
  const parts: string[] = [];

  // Frontmatter
  parts.push('---');
  parts.push(`title: '${config.title}'`);
  parts.push(`description: '${config.description.replace(/'/g, "''")}'`);
  parts.push('keywords:');
  parts.push('  [');
  parts.push(
    config.keywords.map((k) => `    '${k}'`).join(',\n') + ','
  );
  parts.push('  ]');
  parts.push('---');
  parts.push('');

  // Auto-generated notice
  parts.push('{/* AUTO-GENERATED from JSDoc via TypeDoc. Do not edit by hand. */}');
  parts.push('{/* Run `npm run docs:mintlify` to regenerate. */}');
  parts.push('');

  // Intro
  parts.push(config.intro);
  parts.push('');

  // Notes
  if (config.notes) {
    for (const note of config.notes) {
      parts.push('<Note>');
      parts.push(`  ${note}`);
      parts.push('</Note>');
      parts.push('');
    }
  }

  // Main class methods
  if (mainClass && mainClass.methods.length > 0) {
    const accessorParts = config.accessor.split('.');
    const accessorPrefix = accessorParts[accessorParts.length - 1];

    for (const method of mainClass.methods) {
      parts.push(generateMethodMdx(method, accessorPrefix));
    }
  }

  // Sub-resource methods
  for (const subClass of subClasses) {
    const subConfig = config.subResources?.[subClass.name];
    if (!subConfig) continue;

    parts.push(`## ${subConfig.label}`);
    parts.push('');

    for (const method of subClass.methods) {
      parts.push(generateMethodMdx(method, subConfig.accessor));
    }
  }

  // Related resources
  if (config.related && config.related.length > 0) {
    parts.push('## Related resources');
    parts.push('');
    parts.push('<CardGroup cols={2}>');
    for (const card of config.related) {
      parts.push(`  <Card title="${card.title}" icon="${card.icon}" href="${card.href}">`);
      parts.push(`    ${card.description}`);
      parts.push('  </Card>');
    }
    parts.push('</CardGroup>');
    parts.push('');
  }

  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

if (!existsSync(DOCS_API)) {
  console.error('Error: docs/api/ not found. Run "npm run docs:api" first (or just "typedoc").');
  process.exit(1);
}

console.log('Generating Mintlify resource pages from TypeDoc output...\n');

let generated = 0;
for (const resource of RESOURCES) {
  const mdx = generateResourceMdx(resource);
  if (!mdx) continue;

  const outPath = join(MINTLIFY_RESOURCES, `${resource.name}.mdx`);
  writeFileSync(outPath, mdx);
  console.log(`  ${resource.name}.mdx`);
  generated++;
}

console.log(`\nGenerated ${generated} Mintlify resource pages.`);
