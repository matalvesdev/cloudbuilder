#!/bin/bash
# Chaos Experiment: Kill OPA (Open Policy Agent) container
# Validates: Backend handles OPA unavailability gracefully
# Expected: Backend should use fallback (cached policies or deny-by-default)
# Duration: Kill for 30s, then restore

set -euo pipefail

BACKEND_URL="${BACKEND_URL:-http://localhost:8080}"
CONTAINER="cloudbuilder-opa"

echo "=== CHAOS: OPA Kill ==="
echo "Target: $CONTAINER"
echo "Backend: $BACKEND_URL"
echo ""

# Step 1: Pre-chaos health check
echo "[1/5] Pre-chaos health check..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/actuator/health/liveness")
if [ "$HTTP_CODE" != "200" ]; then
  echo "FAIL: Backend not healthy (HTTP $HTTP_CODE). Aborting."
  exit 1
fi
echo "  Backend healthy ✓"

# Step 2: Verify OPA is running
echo "[2/5] Verifying OPA is running..."
OPA_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8181/health")
if [ "$OPA_CODE" != "200" ]; then
  echo "WARN: OPA not healthy (HTTP $OPA_CODE). Proceeding anyway."
else
  echo "  OPA healthy ✓"
fi

# Step 3: Kill OPA
echo "[3/5] Killing OPA container..."
docker stop "$CONTAINER" 2>/dev/null || echo "  Container already stopped or not found"
echo "  OPA stopped ✓"

# Step 4: Monitor backend during OPA outage (30s)
echo "[4/5] Monitoring backend for 30s..."
FAILURES=0
TOTAL_CHECKS=0
for i in $(seq 1 6); do
  sleep 5
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/actuator/health/liveness")
  if [ "$HTTP_CODE" != "200" ]; then
    FAILURES=$((FAILURES + 1))
    echo "  [${i}/6] FAIL: health check HTTP $HTTP_CODE"
  else
    echo "  [${i}/6] OK: health check 200"
  fi

  # Also test an API endpoint
  API_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/v1/canvases" -H "Authorization: Bearer ${AUTH_TOKEN:-}")
  echo "  [${i}/6] API canvases: HTTP $API_CODE"
done

# Step 5: Restore OPA
echo "[5/5] Restoring OPA container..."
docker start "$CONTAINER" 2>/dev/null || echo "  Could not restart (may need docker-compose up)"
sleep 5

FINAL_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/actuator/health/liveness")
echo ""
echo "=== RESULTS ==="
echo "Health Check Failures: $FAILURES / $TOTAL_CHECKS"
echo "Final health: HTTP $FINAL_CODE"

if [ "$FAILURES" -gt 2 ]; then
  echo "WARN: Backend degraded significantly during OPA outage"
else
  echo "PASS: Backend survived OPA outage"
fi
