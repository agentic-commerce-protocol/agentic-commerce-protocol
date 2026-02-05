#!/bin/bash
#
# Quick Setup Script for Agentic Commerce Protocol Development
#

echo "🚀 Setting up Agentic Commerce Protocol development environment..."
echo ""

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install it first:"
    echo "   npm install -g pnpm"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Run validation to ensure everything works
echo ""
echo "🔍 Running validation checks..."
pnpm run validate:all

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "📚 Next steps:"
    echo "   • Read VALIDATION_SYSTEM.md to understand the validation system"
    echo "   • Optionally install pre-commit hook:"
    echo "     ln -s ../../scripts/pre-commit-hook.sh .git/hooks/pre-commit"
    echo ""
    echo "🎯 Common commands:"
    echo "   • pnpm run validate:all           - Validate everything"
    echo "   • pnpm run compile:schema         - Compile schemas"
    echo "   • pnpm run validate:examples      - Validate examples"
    echo ""
else
    echo ""
    echo "⚠️  Setup complete but validation found issues."
    echo "   This is normal if you're working on fixes."
    echo "   Run 'pnpm run validate:all' to see details."
    echo ""
fi
