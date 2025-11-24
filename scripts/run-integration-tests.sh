#!/bin/bash

# Integration test runner script for SW Combine SDK

set -e

echo "🧪 SW Combine SDK - Integration Test Runner"
echo "==========================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found!"
    echo ""
    echo "Please create a .env file with your credentials:"
    echo "  cp .env.example .env"
    echo "  # Edit .env and add your credentials"
    echo ""
    exit 1
fi

# Load .env
export $(cat .env | grep -v '^#' | xargs)

# Check for required credentials
if [ -z "$SWC_CLIENT_ID" ] || [ -z "$SWC_CLIENT_SECRET" ]; then
    echo "❌ Missing required credentials!"
    echo ""
    echo "Please set the following in your .env file:"
    echo "  SWC_CLIENT_ID=your_client_id"
    echo "  SWC_CLIENT_SECRET=your_client_secret"
    echo ""
    exit 1
fi

echo "✓ Found credentials"
echo ""

# Check for access token
if [ -z "$SWC_ACCESS_TOKEN" ]; then
    echo "⚠️  No SWC_ACCESS_TOKEN found"
    echo "   Some tests requiring authentication will be skipped"
    echo ""
else
    echo "✓ Found access token"
    echo ""
fi

# Check for test data
if [ -z "$TEST_CHARACTER_UID" ] || [ -z "$TEST_FACTION_UID" ]; then
    echo "⚠️  Missing test data (TEST_CHARACTER_UID, TEST_FACTION_UID)"
    echo "   Some tests will be skipped"
    echo ""
else
    echo "✓ Found test data"
    echo ""
fi

# Create api-responses directory
mkdir -p tests/integration/api-responses

echo "Running integration tests..."
echo ""

# Run tests
npm run test:integration

echo ""
echo "==========================================="
echo "✅ Integration tests complete!"
echo ""
echo "API responses saved to: tests/integration/api-responses/"
echo ""
echo "Next steps:"
echo "  1. Review captured API responses"
echo "  2. Refine TypeScript types based on real data"
echo "  3. Update SDK if needed"
