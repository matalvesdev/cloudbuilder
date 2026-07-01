#!/bin/bash
# Orchestrated Chaos Runner — runs all chaos experiments sequentially
# Usage: ./chaos-run.sh [--all | --kafka | --db | --opa]
# Each experiment logs results to tests/chaos/results/

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RESULTS_DIR="$SCRIPT_DIR/results"
mkdir -p "$RESULTS_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_FILE="$RESULTS_DIR/chaos-$TIMESTAMP.log"

log() {
  echo "$1" | tee -a "$RESULTS_FILE"
}

run_experiment() {
  local name="$1"
  local script="$2"
  local start=$(date +%s)

  log ""
  log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  log "  Experiment: $name"
  log "  Started: $(date -Iseconds)"
  log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  if bash "$script" 2>&1 | tee -a "$RESULTS_FILE"; then
    local status="PASS"
  else
    local status="FAIL"
  fi

  local end=$(date +%s)
  local duration=$((end - start))
  log ""
  log "  Status: $status (${duration}s)"
  log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  echo "$status" > "$RESULTS_DIR/${name}.status"
}

# Parse arguments
EXPERIMENT="${1:---all}"

log "CloudBuilder Chaos Test Suite"
log "Started: $(date -Iseconds)"
log "Results: $RESULTS_FILE"
log ""

case "$EXPERIMENT" in
  --kafka)
    run_experiment "kafka-kill" "$SCRIPT_DIR/kafka-kill.sh"
    ;;
  --db)
    run_experiment "db-latency" "$SCRIPT_DIR/db-latency.sh"
    ;;
  --opa)
    run_experiment "opa-kill" "$SCRIPT_DIR/opa-kill.sh"
    ;;
  --all)
    run_experiment "kafka-kill" "$SCRIPT_DIR/kafka-kill.sh"
    sleep 10  # Brief recovery between experiments
    run_experiment "db-latency" "$SCRIPT_DIR/db-latency.sh"
    sleep 10
    run_experiment "opa-kill" "$SCRIPT_DIR/opa-kill.sh"
    ;;
  *)
    echo "Usage: $0 [--all | --kafka | --db | --opa]"
    exit 1
    ;;
esac

# Summary
log ""
log "══════════════════════════════════════════════════"
log "  SUMMARY"
log "══════════════════════════════════════════════════"
PASS_COUNT=0
FAIL_COUNT=0
for status_file in "$RESULTS_DIR"/*.status; do
  if [ -f "$status_file" ]; then
    name=$(basename "$status_file" .status)
    status=$(cat "$status_file")
    log "  $name: $status"
    if [ "$status" = "PASS" ]; then
      PASS_COUNT=$((PASS_COUNT + 1))
    else
      FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    rm "$status_file"
  fi
done

log ""
log "  Total: $((PASS_COUNT + FAIL_COUNT)) | Pass: $PASS_COUNT | Fail: $FAIL_COUNT"
log "  Finished: $(date -Iseconds)"
log "══════════════════════════════════════════════════"

if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
fi
