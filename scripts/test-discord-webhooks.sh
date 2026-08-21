#!/usr/bin/env bash
# test-discord-webhooks.sh — Test all configured Discord webhooks
# Usage: source .env.discord && ./scripts/test-discord-webhooks.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "═══════════════════════════════════════════════════════════"
echo "  🧪 Teste de Webhooks — Discord"
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
  "content": "🧪 **Teste de Webhook** — CloudBuilder\nCanal: $channel\nTimestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")\n\nSe você vê esta mensagem, o webhook está funcionando! ✅"
}
EOF
)

  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    "$url" 2>/dev/null)

  if [ "$HTTP_CODE" = "204" ] || [ "$HTTP_CODE" = "200" ]; then
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
test_webhook "Bug Reports" "${DISCORD_BUG_WEBHOOK_URL:-}" "🐛" "#bugs"
test_webhook "Feedback" "${DISCORD_FEEDBACK_WEBHOOK_URL:-}" "⭐" "#feedback-rápido"
test_webhook "Sugestões" "${DISCORD_SUGGESTIONS_WEBHOOK_URL:-}" "💡" "#sugestões"
test_webhook "Dúvidas" "${DISCORD_QUESTIONS_WEBHOOK_URL:-}" "❓" "#dúvidas"
test_webhook "Suporte" "${DISCORD_SUPPORT_WEBHOOK_URL:-}" "🔧" "#suporte-técnico"
test_webhook "Geral" "${DISCORD_WEBHOOK_URL:-}" "💬" "#bate-papo"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  📊 Resultado: $PASS ✅ | $FAIL ❌ | $SKIP ⏭️"
echo "═══════════════════════════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "  ⚠️  Alguns webhooks falharam. Verifique:"
  echo "  1. A URL está correta?"
  echo "  2. O webhook está ativo no Discord?"
  echo "  3. O bot tem permissão para enviar mensagens?"
  echo ""
  exit 1
fi

if [ "$PASS" -eq 0 ] && [ "$SKIP" -gt 0 ]; then
  echo ""
  echo "  ℹ️  Nenhum webhook configurado."
  echo "  Execute: ./scripts/setup-discord-webhooks.sh"
  echo ""
  exit 0
fi

echo ""
echo "  🎉 Todos os webhooks estão funcionando!"
echo ""
