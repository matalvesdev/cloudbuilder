#!/usr/bin/env bash
# setup-discord-webhooks.sh — Interactive setup for Discord webhooks
# Creates .env.discord file with webhook URLs for each channel
#
# Usage: ./scripts/setup-discord-webhooks.sh
# Then: source .env.discord

set -euo pipefail

ENV_FILE="$(cd "$(dirname "$0")/.." && pwd)/.env.discord"

echo "═══════════════════════════════════════════════════════════"
echo "  🎮 Discord Webhook Setup — CloudBuilder"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Este script configura webhooks para cada canal do Discord."
echo ""
echo "📋 Passo 1: Criar webhooks no Discord"
echo "─────────────────────────────────────"
echo "  1. Abra o Discord → Server Settings → Integrations → Webhooks"
echo "  2. Clique 'New Webhook' para cada canal:"
echo ""
echo "  Canal               │ Descrição"
echo "  ────────────────────┼─────────────────────────────────"
echo "  #bugs               │ Bugs reportados pelos testers"
echo "  #sugestões          │ Ideias e melhorias"
echo "  #dúvidas            │ Perguntas sobre uso"
echo "  #feedback-rápido    │ Notas 1-5 estrelas"
echo "  #bate-papo          │ Conversa geral"
echo "  #suporte-técnico    │ Problemas técnicos"
echo ""
echo "  3. Para cada webhook, selecione o canal e copie a URL"
echo ""

# Function to read webhook URL
read_webhook() {
  local name="$1"
  local description="$2"
  local url=""

  echo "─────────────────────────────────────"
  echo "📡 Webhook: $name"
  echo "   Descrição: $description"
  echo ""
  read -r -p "   Cole a URL do webhook (ou Enter para pular): " url

  if [ -n "$url" ]; then
    # Validate URL format
    if [[ "$url" == https://discord.com/api/webhooks/* ]] || [[ "$url" == https://discordapp.com/api/webhooks/* ]]; then
      echo "   ✅ URL válida"
      echo "$url"
    else
      echo "   ⚠️  URL parece inválida (deve começar com https://discord.com/api/webhooks/)"
      echo "   Usando mesmo assim..."
      echo "$url"
    fi
  else
    echo "   ⏭️  Pulado"
    echo ""
  fi
}

echo "📝 Passo 2: Colar as URLs dos webhooks"
echo ""

# Collect webhook URLs
BUGS_WEBHOOK=$(read_webhook "#bugs" "Bugs reportados pelos testers")
FEEDBACK_WEBHOOK=$(read_webhook "#feedback-rápido" "Notas 1-5 estrelas")
SUGGESTIONS_WEBHOOK=$(read_webhook "#sugestões" "Ideias e melhorias")
QUESTIONS_WEBHOOK=$(read_webhook "#dúvidas" "Perguntas sobre uso")
GENERAL_WEBHOOK=$(read_webhook "#bate-papo" "Conversa geral")
SUPPORT_WEBHOOK=$(read_webhook "#suporte-técnico" "Problemas técnicos")

echo ""
echo "─────────────────────────────────────"

# Write .env.discord file
cat > "$ENV_FILE" <<ENVEOF
# ═══════════════════════════════════════════════════════════
# Discord Webhooks — CloudBuilder
# Gerado em: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# ═══════════════════════════════════════════════════════════

# ── Webhook Principal (fallback) ──────────────────────────
${GENERAL_WEBHOOK:+DISCORD_WEBHOOK_URL="$GENERAL_WEBHOOK"}

# ── Webhooks por Canal ────────────────────────────────────
${BUGS_WEBHOOK:+DISCORD_BUG_WEBHOOK_URL="$BUGS_WEBHOOK"}
${FEEDBACK_WEBHOOK:+DISCORD_FEEDBACK_WEBHOOK_URL="$FEEDBACK_WEBHOOK"}
${SUGGESTIONS_WEBHOOK:+DISCORD_SUGGESTIONS_WEBHOOK_URL="$SUGGESTIONS_WEBHOOK"}
${QUESTIONS_WEBHOOK:+DISCORD_QUESTIONS_WEBHOOK_URL="$QUESTIONS_WEBHOOK"}
${SUPPORT_WEBHOOK:+DISCORD_SUPPORT_WEBHOOK_URL="$SUPPORT_WEBHOOK"}

# ── Slack (opcional) ──────────────────────────────────────
# SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
# SLACK_BUG_WEBHOOK_URL="https://hooks.slack.com/services/..."
# SLACK_FEEDBACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
ENVEOF

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ Configuração salva em: .env.discord"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 Próximos passos:"
echo ""
echo "  1. Carregar variáveis:"
echo "     source .env.discord"
echo ""
echo "  2. Testar webhook:"
echo "     ./scripts/discord-webhook.sh bug \"Teste\" \"Mensagem\" canvas medium"
echo ""
echo "  3. Usar no feedback form:"
echo "     Abra docs/feedback-form.html"
echo "     Selecione 'Discord'"
echo "     Cole a URL do webhook"
echo ""
echo "═══════════════════════════════════════════════════════════"
