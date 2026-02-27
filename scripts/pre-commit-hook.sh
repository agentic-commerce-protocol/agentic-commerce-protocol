#!/bin/bash
#
# Git pre-commit hook for validating specification consistency
# 
# To install: 
#   ln -s ../../scripts/pre-commit-hook.sh .git/hooks/pre-commit
#
# To bypass for emergency commits:
#   git commit --no-verify
#

echo "🔍 Running specification consistency checks..."

# Run validation
pnpm run validate:all

# Capture exit code
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo ""
  echo "❌ Validation failed! Commit blocked."
  echo ""
  echo "To fix:"
  echo "  1. Review the errors above"
  echo "  2. Run 'pnpm run validate:all' to test fixes"
  echo "  3. Try committing again"
  echo ""
  echo "To bypass (not recommended):"
  echo "  git commit --no-verify"
  echo ""
  exit 1
fi

echo "✅ All validations passed!"
exit 0
