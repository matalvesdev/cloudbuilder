#!/usr/bin/env bash
# setup-slack-webhooks.sh — Interactive setup for Slack webhooks
# Creates .env.slack file with webhook URLs
#
# Usage: ./scripts/setup-slack-webhooks.sh

set -euo pipefail

ENV_FILE="$(cd "$(dirname "$0")/.." && pwd)/.env.slack"

echo "═══════════════════════════════════════════════════════════"
echo "  📢 Slack Webhook Setup — CloudBuilder"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Este script configura webhooks para cada canal do Slack."
echo ""
echo "📋 Passo 1: Criar webhooks no Slack"
echo "─────────────────────────────────────"
echo "  1. Acesse https://api.slack.com/apps"
echo "  2. Crie um novo app: 'CloudBuilder Feedback'"
echo "  3. Ative 'Incoming Webhooks'"
echo "  4. Clique 'Add New Webhook to Workspace'"
echo "  5. Selecione o canal e copie a URL"
echo ""
echo "  Canais recomendados:"
echo ""
echo "  Canal               │ Descrição"
echo "  ────────────────────┼─────────────────────────────────"
echo "  #bugs               │ Bugs reportados pelos testers"
echo "  #feedback           │ Notas 1-5 estrelas"
echo "  #sugestoes          │ Ideias e melhorias"
echo "  #duvidas            │ Perguntas sobre uso"
echo "  #geral              │ Conversa geral"
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
    if [[ "$url" == https://hooks.slack.com/services/* ]]; then
      echo "   ✅ URL válida"
      echo "$url"
    else
      echo "   ⚠️  URL parece inválida (deve começar com https://hooks.slack.com/services/)"
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
FEEDBACK_WEBHOOK=$(read_webhook "#feedback" "Notas 1-5 estrelas")
SUGGESTIONS_WEBHOOK=$(read_webhook "#sugestoes" "Ideias e melhorias")
QUESTIONS_WEBHOOK=$(read_webhook "#duvidas" "Perguntas sobre uso")
GENERAL_WEBHOOK=$(read_webhook "#geral" "Conversa geral")

echo ""
echo "─────────────────────────────────────"

# Write .env.slack file
cat > "$ENV_FILE" <<ENVEOF
# ═══════════════════════════════════════════════════════════
# Slack Webhooks — CloudBuilder
# Gerado em: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# ═══════════════════════════════════════════════════════════

# ── Webhook Principal (fallback) ──────────────────────────
${GENERAL_WEBHOOK:+SLACK_WEBHOOK_URL="$GENERAL_WEBHOOK"}

# ── Webhooks por Canal ────────────────────────────────────
${BUGS_WEBHOOK:+SLACK_BUG_WEBHOOK_URL="$BUGS_WEBHOOK"}
${FEEDBACK_WEBHOOK:+SLACK_FEEDBACK_WEBHOOK_URL="$FEEDBACK_WEBHOOK"}
${SUGGESTIONS_WEBHOOK:+SLACK_SUGGESTIONS_WEBHOOK_URL="$SUGGESTIONS_WEBHOOK"}
${QUESTIONS_WEBHOOK:+SLACK_QUESTIONS_WEBHOOK_URL="$QUESTIONS_WEBHOOK"}

# ── Discord (opcional) ────────────────────────────────────
# DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
# DISCORD_BUG_WEBHOOK_URL="https://discord.com/api/webhooks/..."
ENVEOF

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ Configuração salva em: .env.slack"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 Próximos passos:"
echo ""
echo "  1. Carregar variáveis:"
echo "     source .env.slack"
echo ""
echo "  2. Testar webhook:"
echo "     ./scripts/slack-webhook.sh bug \"Teste\" \"Mensagem\" canvas medium"
echo ""
echo "  3. Usar no feedback form:"
echo "     Abra docs/feedback-form.html"
echo "     Selecione 'Slack'"
echo "     Cole a URL do webhook"
echo ""
echo "═══════════════════════════════════════════════════════════"
