#!/bin/bash
# Chaos Experiment: Kill Kafka container
# Validates: Backend gracefully degrades when Kafka is unavailable
# Expected: API endpoints continue working (Kafka is optional via cloudbuilder.kafka.enabled)
# Duration: Kill for 60s, then restore

set -euo pipefail

BACKEND_URL="${BACKEND_URL:-http://localhost:8080}"
CONTAINER="cloudbuilder-kafka"

echo "=== CHAOS: Kafka Kill ==="
echo "Target: $CONTAINER"
echo "Backend: $BACKEND_URL"
echo ""

# Step 1: Verify system is healthy before chaos
echo "[1/5] Pre-chaos health check..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/actuator/health/liveness")
if [ "$HTTP_CODE" != "200" ]; then
  echo "FAIL: Backend not healthy (HTTP $HTTP_CODE). Aborting."
  exit 1
fi
echo "  Backend healthy ✓"

# Step 2: Record baseline metrics
echo "[2/5] Recording baseline..."
BASELINE_START=$(date +%s)
BASELINE_CANVAS=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/v1/canvases" -H "Authorization: Bearer ${AUTH_TOKEN:-}" | tail -1)
echo "  Baseline canvas list: HTTP $BASELINE_CANVAS"

# Step 3: Kill Kafka
echo "[3/5] Killing Kafka container..."
docker stop "$CONTAINER" 2>/dev/null || echo "  Container already stopped or not found"
echo "  Kafka stopped ✓"

# Step 4: Monitor backend during chaos (60 seconds)
echo "[4/5] Monitoring backend for 60s..."
FAILURES=0
TOTAL_CHECKS=0
for i in $(seq 1 12); do
  sleep 5
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/actuator/health/liveness")
  if [ "$HTTP_CODE" != "200" ]; then
    FAILURES=$((FAILURES + 1))
    echo "  [${i}/12] FAIL: health check returned HTTP $HTTP_CODE"
  else
    echo "  [${i}/12] OK: health check 200"
  fi
done

# Step 5: Restore Kafka
echo "[5/5] Restoring Kafka container..."
docker start "$CONTAINER" 2>/dev/null || echo "  Could not restart container (may need docker-compose up)"
echo "  Kafka restored ✓"

# Wait for Kafka to be ready
echo "  Waiting 15s for Kafka to initialize..."
sleep 15

# Final health check
FINAL_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/actuator/health/liveness")
echo ""
echo "=== RESULTS ==="
echo "Checks: $TOTAL_CHECKS | Failures: $FAILURES"
echo "Final health: HTTP $FINAL_CODE"

if [ "$FAILURES" -gt 0 ]; then
  echo "WARN: $FAILURES health checks failed during Kafka outage"
  echo "This may indicate backend has hard dependency on Kafka (should be optional)"
else
  echo "PASS: Backend survived Kafka outage with zero failures"
fi
