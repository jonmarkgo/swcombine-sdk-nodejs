#!/bin/bash
set -e  # Exit on error

echo "🚀 Starting release process..."

# Check if working directory is clean
if [[ -n $(git status -s) ]]; then
  echo "❌ Error: Working directory not clean. Commit or stash changes."
  exit 1
fi

# Run tests
echo "🧪 Running tests..."
npm test

# Build
echo "📦 Building..."
npm run build

# Get version type from argument
VERSION_TYPE=${1:-patch}

echo "📝 Bumping version ($VERSION_TYPE)..."
npm version $VERSION_TYPE

NEW_VERSION=$(node -p "require('./package.json').version")

echo "🚀 Publishing version $NEW_VERSION..."
npm publish --access public

echo "📤 Pushing to git..."
git push origin main --tags

echo "✅ Successfully published version $NEW_VERSION!"
echo "📦 Package: https://www.npmjs.com/package/swcombine-sdk"
echo ""
echo "Next steps:"
echo "  1. Create GitHub release at: https://github.com/yourusername/swcombine-sdk-nodejs/releases/new"
echo "  2. Select tag: v$NEW_VERSION"
echo "  3. Add release notes"
