# Local Development Guide

This guide explains how to use the SDK locally in another app before publishing to npm.

## Quick Start (Recommended Method)

### 1. Build the SDK

```bash
cd /path/to/swcombine-sdk-nodejs
npm install
npm run build
```

### 2. Link it globally

```bash
npm link
```

### 3. Use it in your app

```bash
cd /path/to/your-app
npm link swcombine-sdk
```

### 4. Import and use

```typescript
import { SWCombine } from 'swcombine-sdk';

const client = new SWCombine({
  clientId: process.env.SWC_CLIENT_ID!,
  clientSecret: process.env.SWC_CLIENT_SECRET!,
});

const character = await client.character.getByHandle({
  handle: 'test-character',
});
```

## Development Workflow

### Watch Mode for SDK Changes

In your SDK directory, run both watch commands:

```bash
# Terminal 1: Watch and rebuild automatically
npm run build:watch

# Or manually rebuild after changes
npm run build
```

In your app, the changes will be available after rebuild (no need to reinstall).

### Testing Your Changes

1. Make changes to SDK source code
2. Rebuild: `npm run build`
3. Test in your app
4. Repeat

## Alternative Methods

### Method 1: Direct Path Install

Simplest but requires reinstall after changes:

```bash
cd /path/to/your-app
npm install ../swcombine-sdk-nodejs
```

To update after SDK changes:
```bash
npm uninstall swcombine-sdk
npm install ../swcombine-sdk-nodejs
```

### Method 2: npm pack (Production-Like)

Most similar to how it will work from npm:

```bash
# In SDK directory
npm run build
npm pack
# Creates: swcombine-sdk-0.1.0.tgz

# In your app
npm install /path/to/swcombine-sdk-nodejs/swcombine-sdk-0.1.0.tgz
```

### Method 3: Package.json File Reference

Add to your app's `package.json`:

```json
{
  "dependencies": {
    "swcombine-sdk": "file:../swcombine-sdk-nodejs"
  }
}
```

Then:
```bash
npm install
```

## Complete Development Setup Script

Create this helper script in your SDK directory:

```bash
#!/bin/bash
# scripts/dev-link.sh

echo "🔗 Setting up local development..."

# Build the SDK
echo "📦 Building SDK..."
npm run build

# Create global link
echo "🔗 Creating global link..."
npm link

echo ""
echo "✅ SDK ready for local development!"
echo ""
echo "In your app directory, run:"
echo "  npm link swcombine-sdk"
echo ""
echo "To rebuild after changes:"
echo "  npm run build"
```

Make it executable:
```bash
chmod +x scripts/dev-link.sh
```

Run it:
```bash
./scripts/dev-link.sh
```

## Example App Setup

Create a test app to try your SDK:

```bash
mkdir test-app
cd test-app
npm init -y
npm install typescript @types/node tsx dotenv
npm link swcombine-sdk
```

Create `test.ts`:

```typescript
import { SWCombine, CharacterScopes } from 'swcombine-sdk';
import { config } from 'dotenv';

config();

async function main() {
  const client = new SWCombine({
    clientId: process.env.SWC_CLIENT_ID!,
    clientSecret: process.env.SWC_CLIENT_SECRET!,
  });

  console.log('Testing SDK...');

  const character = await client.character.getByHandle({
    handle: 'test-handle',
  });

  console.log('Character:', character);
}

main().catch(console.error);
```

Run it:
```bash
npx tsx test.ts
```

## Troubleshooting

### "Cannot find module 'swcombine-sdk'"

Make sure you:
1. Built the SDK: `npm run build` in SDK directory
2. Linked it: `npm link` in SDK directory
3. Linked in your app: `npm link swcombine-sdk` in app directory

### Changes Not Reflecting

1. Rebuild the SDK: `npm run build`
2. If still not working, unlink and relink:
```bash
# In your app
npm unlink swcombine-sdk

# In SDK directory
npm unlink
npm link

# In your app
npm link swcombine-sdk
```

### TypeScript Can't Find Types

Make sure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

### "Cannot use import statement outside a module"

Either:

1. Use `.ts` files and run with `tsx`:
```bash
npx tsx your-file.ts
```

2. Or add to your `package.json`:
```json
{
  "type": "module"
}
```

### Multiple Versions Issue

If you have issues with multiple linked packages:

```bash
# Unlink everything
npm unlink swcombine-sdk
cd /path/to/sdk
npm unlink

# Clear npm cache
npm cache clean --force

# Re-link
cd /path/to/sdk
npm link
cd /path/to/your-app
npm link swcombine-sdk
```

## Clean Up

When you're done with local development:

```bash
# In your app
npm unlink swcombine-sdk
npm install swcombine-sdk  # Install from npm (when published)

# In SDK directory
npm unlink
```

## Watch Mode Setup

For a smoother development experience, set up watch mode:

Add to SDK's `package.json`:

```json
{
  "scripts": {
    "build:watch": "tsc -p tsconfig.esm.json --watch"
  }
}
```

Then in SDK directory:
```bash
npm run build:watch
```

Now your changes rebuild automatically!

## Best Practices

1. **Always build before testing** - The built files in `dist/` are what gets used
2. **Use TypeScript in your test app** - Catches type errors early
3. **Test with production-like setup** - Use `npm pack` before publishing
4. **Keep SDK and app in same Node version** - Avoids compatibility issues
5. **Clear node_modules if things get weird** - Sometimes a clean slate helps

## Example Development Session

```bash
# Terminal 1: SDK directory - watch mode
cd /path/to/swcombine-sdk-nodejs
npm run build:watch

# Terminal 2: Test app directory
cd /path/to/test-app
npm link swcombine-sdk

# Make changes in Terminal 1 (SDK)
# Files rebuild automatically

# Test in Terminal 2
npx tsx test.ts

# Iterate!
```

## Publishing Checklist

Before publishing to npm, test locally with `npm pack`:

```bash
# In SDK directory
npm run build
npm pack

# In test app
npm install /path/to/sdk/swcombine-sdk-0.1.0.tgz

# Test thoroughly
npm test

# If all good, publish!
npm publish
```

This ensures your package works exactly like it will from npm.
