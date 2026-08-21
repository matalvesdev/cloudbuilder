#!/usr/bin/env bash
# test-discord-webhooks.sh — Test all configured Discord webhooks

set -euo pipefail

echo "═══════════════════════════════════════════════════════════"
echo "  Teste de Webhooks - Discord"
echo "═══════════════════════════════════════════════════════════"
echo ""

PASS=0
FAIL=0
SKIP=0

test_webhook() {
  local name="$1"
  local url="$2"
  local channel="$3"

  if [ -z "$url" ]; then
    echo "  [SKIP] $name ($channel)"
    SKIP=$((SKIP + 1))
    return
  fi

  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$url" \
    -H "Content-Type: application/json" \
    -d '{"content":"Teste CloudBuilder - '"$channel"'"}' \
    2>/dev/null)

  if [ "$HTTP_CODE" = "204" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "  [OK] $name ($channel)"
    PASS=$((PASS + 1))
  else
    echo "  [FAIL] $name ($channel) - HTTP $HTTP_CODE"
    FAIL=$((FAIL + 1))
  fi
}

echo "Testando webhooks..."
echo ""

test_webhook "Bug Reports" "${DISCORD_BUG_WEBHOOK_URL:-}" "#bugs"
test_webhook "Feedback" "${DISCORD_FEEDBACK_WEBHOOK_URL:-}" "#feedback"
test_webhook "Geral" "${DISCORD_WEBHOOK_URL:-}" "#geral"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Resultado: $PASS OK | $FAIL FAIL | $SKIP SKIP"
echo "═══════════════════════════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi

if [ "$PASS" -gt 0 ]; then
  echo ""
  echo "  Todos os webhooks funcionando!"
fi
echo ""
