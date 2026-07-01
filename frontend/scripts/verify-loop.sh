#!/bin/bash
# Loop Engineering Verification Script
# Pattern: implement → verify → feedback → refine → stop when 0 errors
# Based on ComPilot paper (arXiv:2511.00592v2)

set -e

echo "🔄 Loop Engineering Verification Starting..."
echo "=============================================="

# Step 1: TypeScript Compilation
echo ""
echo "📝 Step 1: TypeScript Compilation (tsc --noEmit)"
echo "-----------------------------------------------"
if npx tsc --noEmit; then
  echo "✅ TypeScript: 0 errors"
else
  echo "❌ TypeScript: ERRORS FOUND"
  echo "Fix TypeScript errors before proceeding."
  exit 1
fi

# Step 2: Vite Build
echo ""
echo "📦 Step 2: Vite Build"
echo "---------------------"
if npx vite build; then
  echo "✅ Vite Build: SUCCESS"
else
  echo "❌ Vite Build: FAILED"
  echo "Fix build errors before proceeding."
  exit 1
fi

# Step 3: Unit Tests
echo ""
echo "🧪 Step 3: Unit Tests (vitest)"
echo "------------------------------"
if npx vitest run; then
  echo "✅ Tests: ALL PASSED"
else
  echo "❌ Tests: FAILURES DETECTED"
  echo "Fix failing tests before proceeding."
  exit 1
fi

echo ""
echo "=============================================="
echo "✅ Loop Engineering Verification: PASSED"
echo "=============================================="
echo "All checks passed. Ready to commit."