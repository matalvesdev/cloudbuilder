#!/usr/bin/env bash
# test-slack-webhooks.sh — Test all configured Slack webhooks
# Usage: source .env.slack && ./scripts/test-slack-webhooks.sh

set -euo pipefail

echo "═══════════════════════════════════════════════════════════"
echo "  🧪 Teste de Webhooks — Slack"
echo "═══════════════════════════════════════════════════════════"
echo ""

PASS=0
FAIL=0
SKIP=0

test_webhook() {
  local name="$1"
  local url="$2"
  local emoji="$3"
  local channel="$4"

  if [ -z "$url" ]; then
    echo "  ⏭️  $emoji $name ($channel) — não configurado"
    SKIP=$((SKIP + 1))
    return
  fi

  # Send test message
  PAYLOAD=$(cat <<EOF
{
  "text": "🧪 *Teste de Webhook* — CloudBuilder\nCanal: $channel\nTimestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")\n\nSe você vê esta mensagem, o webhook está funcionando! ✅"
}
EOF
)

  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    "$url" 2>/dev/null)

  if [ "$HTTP_CODE" = "200" ]; then
    echo "  ✅ $emoji $name ($channel) — funcionando!"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $emoji $name ($channel) — falhou (HTTP $HTTP_CODE)"
    FAIL=$((FAIL + 1))
  fi
}

echo "📡 Testando webhooks configurados..."
echo ""

# Test each webhook
test_webhook "Bug Reports" "${SLACK_BUG_WEBHOOK_URL:-}" "🐛" "#bugs"
test_webhook "Feedback" "${SLACK_FEEDBACK_WEBHOOK_URL:-}" "⭐" "#feedback"
test_webhook "Sugestões" "${SLACK_SUGGESTIONS_WEBHOOK_URL:-}" "💡" "#sugestoes"
test_webhook "Dúvidas" "${SLACK_QUESTIONS_WEBHOOK_URL:-}" "❓" "#duvidas"
test_webhook "Geral" "${SLACK_WEBHOOK_URL:-}" "💬" "#geral"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  📊 Resultado: $PASS ✅ | $FAIL ❌ | $SKIP ⏭️"
echo "═══════════════════════════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "  ⚠️  Alguns webhooks falharam. Verifique:"
  echo "  1. A URL está correta?"
  echo "  2. O app está instalado no workspace?"
  echo "  3. O bot tem permissão para enviar mensagens?"
  echo ""
  exit 1
fi

if [ "$PASS" -eq 0 ] && [ "$SKIP" -gt 0 ]; then
  echo ""
  echo "  ℹ️  Nenhum webhook configurado."
  echo "  Execute: ./scripts/setup-slack-webhooks.sh"
  echo ""
  exit 0
fi

echo ""
echo "  🎉 Todos os webhooks estão funcionando!"
echo ""
