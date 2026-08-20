#!/usr/bin/env bash
# collect-test-metrics.sh — Collects test results from all layers and generates a JSON snapshot
# Usage: ./scripts/collect-test-metrics.sh
# Output: docs/test-results/metrics-YYYY-MM-DD.json

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RESULTS_DIR="$ROOT/docs/test-results"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
DATE=$(date -u +"%Y-%m-%d")
OUT="$RESULTS_DIR/metrics-${DATE}.json"

mkdir -p "$RESULTS_DIR"

echo "🔍 Collecting test metrics..."

# ─── Backend (Maven) ───────────────────────────────────────────
echo "  ☕ Backend..."
cd "$ROOT/backend"
BACKEND_OUTPUT=$(mvn test 2>&1 || true)
BACKEND_TESTS=$(echo "$BACKEND_OUTPUT" | grep -oP 'Tests run: \K[0-9]+' | tail -1 || echo "0")
BACKEND_FAILURES=$(echo "$BACKEND_OUTPUT" | grep -oP 'Failures: \K[0-9]+' | tail -1 || echo "0")
BACKEND_ERRORS=$(echo "$BACKEND_OUTPUT" | grep -oP 'Errors: \K[0-9]+' | tail -1 || echo "0")
BACKEND_SKIPPED=$(echo "$BACKEND_OUTPUT" | grep -oP 'Skipped: \K[0-9]+' | tail -1 || echo "0")
BACKEND_BUILD=$(echo "$BACKEND_OUTPUT" | grep -c "BUILD SUCCESS" || echo "0")

echo "    Tests: $BACKEND_TESTS | Failures: $BACKEND_FAILURES | Errors: $BACKEND_ERRORS | Skipped: $BACKEND_SKIPPED"

# ─── Frontend (Vitest) ─────────────────────────────────────────
echo "  ⚛  Frontend..."
cd "$ROOT/frontend"
FRONTEND_OUTPUT=$(npm test -- --run 2>&1 || true)
FRONTEND_TESTS=$(echo "$FRONTEND_OUTPUT" | grep -oP 'Tests  \K[0-9]+' | head -1 || echo "0")
FRONTEND_FAILED=$(echo "$FRONTEND_OUTPUT" | grep -oP 'Tests  [0-9]+ failed  \K[0-9]+' | head -1 || echo "0")
FRONTEND_FILES=$(echo "$FRONTEND_OUTPUT" | grep -oP 'Test Files  \K[0-9]+' | head -1 || echo "0")
FRONTEND_PASSSED_FILES=$(echo "$FRONTEND_OUTPUT" | grep -oP 'Test Files  \K[0-9]+ passed' | head -1 | grep -oP '[0-9]+' || echo "0")
FRONTEND_DURATION=$(echo "$FRONTEND_OUTPUT" | grep -oP 'Duration  \K[0-9.]+s' | head -1 || echo "0")

# Handle "N passed" format
if [ "$FRONTEND_FAILED" = "" ] || [ "$FRONTEND_FAILED" = "0" ]; then
  FRONTEND_FAILED=$(echo "$FRONTEND_OUTPUT" | grep -oP 'Tests  [0-9]+ passed' | head -1 | grep -oP '[0-9]+' || echo "0")
  FRONTEND_FAILED="0"
fi
# Re-parse: "Tests  313 passed (313)" means 313 passed, 0 failed
FRONTEND_PASSED=$(echo "$FRONTEND_OUTPUT" | grep -oP 'Tests  \K[0-9]+(?= passed)' | head -1 || echo "0")

echo "    Tests: $FRONTEND_PASSED | Files: $FRONTEND_FILES | Duration: $FRONTEND_DURATION"

# ─── TypeScript Check ──────────────────────────────────────────
echo "  🔷 TypeScript..."
cd "$ROOT/frontend"
TSC_OUTPUT=$(npx tsc --noEmit 2>&1 || true)
TSC_ERRORS=$(echo "$TSC_OUTPUT" | grep -c "error TS" || echo "0")

echo "    Errors: $TSC_ERRORS"

# ─── Go Engine ─────────────────────────────────────────────────
echo "  🐹 Go Engine..."
cd "$ROOT/provision-engine"
GO_OUTPUT=$(go test ./... -count=1 2>&1 || true)
GO_OK=$(echo "$GO_OUTPUT" | grep -c "^ok" || echo "0")
GO_FAIL=$(echo "$GO_OUTPUT" | grep -c "^FAIL" || echo "0")
GO_NOPKG=$(echo "$GO_OUTPUT" | grep -c "no test files" || echo "0")

echo "    Packages OK: $GO_OK | FAIL: $GO_FAIL | No tests: $GO_NOPKG"

# ─── Generate JSON ─────────────────────────────────────────────
echo ""
echo "📝 Writing $OUT"

cat > "$OUT" <<JSONEOF
{
  "timestamp": "$TIMESTAMP",
  "date": "$DATE",
  "overall": {
    "totalTests": $(( ${BACKEND_TESTS:-0} + ${FRONTEND_PASSED:-0} + ${GO_OK:-0} )),
    "failures": $(( ${BACKEND_FAILURES:-0} + ${BACKEND_ERRORS:-0} + ${FRONTEND_FAILED:-0} + ${GO_FAIL:-0} )),
    "allPassing": $([ "${BACKEND_FAILURES:-0}" = "0" ] && [ "${BACKEND_ERRORS:-0}" = "0" ] && [ "${FRONTEND_FAILED:-0}" = "0" ] && [ "${GO_FAIL:-0}" = "0" ] && echo "true" || echo "false")
  },
  "backend": {
    "tests": ${BACKEND_TESTS:-0},
    "failures": ${BACKEND_FAILURES:-0},
    "errors": ${BACKEND_ERRORS:-0},
    "skipped": ${BACKEND_SKIPPED:-0},
    "buildSuccess": $([ "${BACKEND_BUILD:-0}" != "0" ] && echo "true" || echo "false")
  },
  "frontend": {
    "tests": ${FRONTEND_PASSED:-0},
    "files": ${FRONTEND_FILES:-0},
    "passedFiles": ${FRONTEND_PASSSED_FILES:-0},
    "duration": "${FRONTEND_DURATION:-0}"
  },
  "typescript": {
    "errors": ${TSC_ERRORS:-0}
  },
  "goEngine": {
    "packagesOk": ${GO_OK:-0},
    "packagesFail": ${GO_FAIL:-0},
    "packagesNoTest": ${GO_NOPKG:-0}
  }
}
JSONEOF

# ─── Summary ───────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════"
echo "  📊 Test Metrics Summary — $DATE"
echo "═══════════════════════════════════════════════"
echo ""
echo "  Backend:     ${BACKEND_TESTS:-0} tests, ${BACKEND_FAILURES:-0} failures, ${BACKEND_SKIPPED:-0} skipped"
echo "  Frontend:    ${FRONTEND_PASSED:-0} tests, ${FRONTEND_FILES:-0} files"
echo "  TypeScript:  ${TSC_ERRORS:-0} errors"
echo "  Go Engine:   ${GO_OK:-0} packages passing"
echo ""
TOTAL=$(( ${BACKEND_TESTS:-0} + ${FRONTEND_PASSED:-0} ))
FAILURES=$(( ${BACKEND_FAILURES:-0} + ${BACKEND_ERRORS:-0} + ${FRONTEND_FAILED:-0} + ${GO_FAIL:-0} ))
echo "  Total:       $TOTAL tests"
echo "  Failures:    $FAILURES"
echo ""

if [ "$FAILURES" -eq 0 ]; then
  echo "  ✅ ALL TESTS PASSING"
else
  echo "  ❌ $FAILURES TESTS FAILING"
fi

echo ""
echo "═══════════════════════════════════════════════"
echo "  📁 Output: $OUT"
echo "═══════════════════════════════════════════════"
