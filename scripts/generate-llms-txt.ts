#!/usr/bin/env tsx
/**
 * Generate llms.txt and llms-full.txt from TypeDoc markdown output.
 *
 * llms.txt  — curated table of contents (per llmstxt.org spec)
 * llms-full.txt — full API reference in a single LLM-readable file
 *
 * Requires: npm run docs:api to have been run first.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DOCS_API = join(ROOT, 'docs', 'api');
const PKG = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Read a markdown file and clean it for standalone LLM consumption. */
function readAndClean(filePath: string): string {
  const raw = readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n');

  // Strip leading breadcrumb lines (links + horizontal rules before the first heading)
  let start = 0;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('# ')) {
      start = i;
      break;
    }
  }

  let content = lines.slice(start).join('\n');

  // Remove "Defined in:" source code links (noise for LLMs)
  content = content.replace(/^Defined in:.*$/gm, '');

  // Convert relative markdown links [Text](../../path/to/File.md) and [Text](../.md#anchor) to plain text
  content = content.replace(/\[`([^\]]+)`\]\([^)]*\.md[^)]*\)/g, '`$1`');
  content = content.replace(/\[([^\]]+)\]\([^)]*\.md[^)]*\)/g, '$1');

  // Collapse 3+ consecutive blank lines into 2
  content = content.replace(/\n{3,}/g, '\n\n');

  return content.trim();
}

/** Collect all .md files under a directory matching a glob-like pattern. */
function collectClassDocs(dir: string): string[] {
  const classesDir = join(dir, 'classes');
  if (!existsSync(classesDir)) return [];
  return readdirSync(classesDir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => join(classesDir, f));
}

// ---------------------------------------------------------------------------
// Define which docs to include and in what order
// ---------------------------------------------------------------------------

interface Section {
  title: string;
  files: string[];
}

function buildSections(): Section[] {
  const sections: Section[] = [];

  // 1. Main client
  sections.push({
    title: 'Client',
    files: [join(DOCS_API, 'SWCombine', 'classes', 'SWCombine.md')],
  });

  // 2. Resource classes (the core of the SDK)
  const resourceDirs = [
    'ApiResource',
    'CharacterResource',
    'FactionResource',
    'GalaxyResource',
    'InventoryResource',
    'MarketResource',
    'NewsResource',
    'TypesResource',
    'EventsResource',
    'LocationResource',
    'DatacardResource',
  ];

  for (const dir of resourceDirs) {
    const files = collectClassDocs(join(DOCS_API, 'resources', dir));
    if (files.length > 0) {
      sections.push({ title: dir.replace('Resource', ''), files });
    }
  }

  // 3. Utilities
  sections.push({
    title: 'Utilities',
    files: [
      join(DOCS_API, 'Timestamp', 'classes', 'Timestamp.md'),
      join(DOCS_API, 'http', 'errors', 'classes', 'SWCError.md'),
    ].filter(existsSync),
  });

  // 4. Key config types
  const configTypes = [
    'ClientConfig',
    'OAuthToken',
    'OAuthAuthorizationOptions',
    'OAuthCallbackQuery',
  ];
  const configFiles = configTypes
    .map((t) => join(DOCS_API, 'types', 'interfaces', `${t}.md`))
    .filter(existsSync);

  if (configFiles.length > 0) {
    sections.push({ title: 'Configuration Types', files: configFiles });
  }

  // 5. Auth scopes
  const scopeVars = ['CharacterScopes', 'MessageScopes', 'FactionScopes', 'Scopes']
    .map((s) => join(DOCS_API, 'auth', 'scopes', 'variables', `${s}.md`))
    .filter(existsSync);

  const scopeFns = ['getAllScopes', 'getReadOnlyScopes', 'getMinimalScopes']
    .map((s) => join(DOCS_API, 'auth', 'scopes', 'functions', `${s}.md`))
    .filter(existsSync);

  if (scopeVars.length > 0 || scopeFns.length > 0) {
    sections.push({ title: 'OAuth Scopes', files: [...scopeVars, ...scopeFns] });
  }

  return sections;
}

// ---------------------------------------------------------------------------
// Generate llms-full.txt
// ---------------------------------------------------------------------------

function generateFull(sections: Section[]): string {
  const parts: string[] = [];

  parts.push(`# ${PKG.name} v${PKG.version}`);
  parts.push('');
  parts.push(`> ${PKG.description}`);
  parts.push('');
  parts.push('## Installation');
  parts.push('');
  parts.push('```bash');
  parts.push(`npm install ${PKG.name}`);
  parts.push('```');
  parts.push('');

  for (const section of sections) {
    parts.push(`---`);
    parts.push('');
    parts.push(`## ${section.title}`);
    parts.push('');

    for (const file of section.files) {
      const content = readAndClean(file);
      parts.push(content);
      parts.push('');
    }
  }

  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// Generate llms.txt (table of contents)
// ---------------------------------------------------------------------------

function generateToc(sections: Section[]): string {
  const parts: string[] = [];

  parts.push(`# ${PKG.name}`);
  parts.push('');
  parts.push(`> ${PKG.description}`);
  parts.push('');
  parts.push('- Full SDK reference: llms-full.txt');
  parts.push('- npm: https://www.npmjs.com/package/swcombine-sdk');
  parts.push('- GitHub: https://github.com/jonmarkgo/swcombine-sdk-nodejs');
  parts.push('- API Docs: https://jonmarkgo.github.io/swcombine-sdk-nodejs/');
  parts.push('- SW Combine API: https://www.swcombine.com/ws/v2.0/developers/index.php');
  parts.push('');

  for (const section of sections) {
    parts.push(`## ${section.title}`);
    for (const file of section.files) {
      const rel = relative(ROOT, file);
      // Extract the class/type name from the filename
      const name = file.split('/').pop()!.replace('.md', '');
      parts.push(`- [${name}](${rel})`);
    }
    parts.push('');
  }

  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

if (!existsSync(DOCS_API)) {
  console.error('Error: docs/api/ not found. Run "npm run docs:api" first.');
  process.exit(1);
}

const sections = buildSections();

const fullContent = generateFull(sections);
const fullPath = join(ROOT, 'llms-full.txt');
writeFileSync(fullPath, fullContent);
console.log(`Generated ${fullPath} (${(fullContent.length / 1024).toFixed(1)} KB)`);

const tocContent = generateToc(sections);
const tocPath = join(ROOT, 'llms.txt');
writeFileSync(tocPath, tocContent);
console.log(`Generated ${tocPath} (${(tocContent.length / 1024).toFixed(1)} KB)`);
