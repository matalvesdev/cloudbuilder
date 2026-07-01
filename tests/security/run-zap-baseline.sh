#!/usr/bin/env bash
# CloudBuilder — OWASP ZAP Baseline Scan Runner
# ADR-036 Layer 11: Penetration/Security Testing
#
# Prerequisites:
#   - Docker installed and running
#   - Backend running on localhost:8080
#
# Usage:
#   cd tests/security && bash run-zap-baseline.sh
#   bash run-zap-baseline.sh --target http://localhost:8080
#   bash run-zap-baseline.sh --quick  # skip auth, just unauthenticated baseline

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:-http://localhost:8080}"
QUICK_MODE=false

# Parse args
while [[ $# -gt 0 ]]; do
  case $1 in
    --target) TARGET="$2"; shift 2 ;;
    --quick) QUICK_MODE=true; shift ;;
    *) TARGET="$1"; shift ;;
  esac
done

echo "═══════════════════════════════════════════════════════════"
echo "  CloudBuilder — OWASP ZAP Baseline Scan"
echo "  Target: $TARGET"
echo "  Mode: $([ "$QUICK_MODE" = true ] && echo 'Quick (unauth)' || echo 'Full')"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check Docker
if ! command -v docker &>/dev/null; then
  echo "❌ Docker not found. Install Docker Desktop and try again."
  exit 1
fi

# Check target is reachable
echo "🔍 Checking if target is reachable..."
if ! curl -sf --max-time 5 "$TARGET/actuator/health" >/dev/null 2>&1; then
  echo "⚠️  Target $TARGET not reachable. Continuing anyway (ZAP will report errors)."
fi

# Create output directory
OUTPUT_DIR="$SCRIPT_DIR/zap-reports"
mkdir -p "$OUTPUT_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$OUTPUT_DIR/zap-baseline-$TIMESTAMP.html"
LOG_FILE="$OUTPUT_DIR/zap-baseline-$TIMESTAMP.log"

echo ""
echo "🚀 Starting ZAP Baseline Scan..."
echo "   Report: $REPORT_FILE"
echo "   Log: $LOG_FILE"
echo ""

# Build ZAP command
ZAP_CMD=(
  docker run --rm
  -v "$OUTPUT_DIR:/zap/wrk:rw"
  -v "$SCRIPT_DIR/zap-baseline.conf:/zap/wrk/zap-baseline.conf:ro"
  ghcr.io/zaproxy/zaproxy:stable
  zap-baseline.py
  -t "$TARGET"
  -c /zap/wrk/zap-baseline.conf
  -r "zap-baseline-$TIMESTAMP.html"
  -l WARN
)

if [ "$QUICK_MODE" = true ]; then
  ZAP_CMD+=(-m "2")  # max minutes per host
fi

# Run scan
if "${ZAP_CMD[@]}" 2>&1 | tee "$LOG_FILE"; then
  echo ""
  echo "✅ ZAP Baseline Scan complete"
  echo "   Report: $REPORT_FILE"
else
  EXIT_CODE=$?
  echo ""
  echo "⚠️  ZAP scan exited with code $EXIT_CODE"
  echo "   Check report for details: $REPORT_FILE"

  # Parse report for High/Critical alerts
  if [ -f "$REPORT_FILE" ]; then
    HIGH_COUNT=$(grep -c 'risk-High' "$REPORT_FILE" 2>/dev/null || echo "0")
    CRITICAL_COUNT=$(grep -c 'risk-Critical' "$REPORT_FILE" 2>/dev/null || echo "0")
    echo "   High/Critical alerts: $HIGH_COUNT / $CRITICAL_COUNT"

    if [ "$HIGH_COUNT" -gt 0 ] || [ "$CRITICAL_COUNT" -gt 0 ]; then
      echo ""
      echo "❌ SECURITY GATE FAILED: High or Critical alerts found"
      echo "   Review the report and remediate before merging"
      exit 1
    fi
  fi
fi

echo ""
echo "📊 Summary:"
echo "   Reports directory: $OUTPUT_DIR"
echo "   Scan complete at: $(date)"
