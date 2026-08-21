#!/usr/bin/env bash
# discord-webhook.sh — Send feedback/bug reports to Discord via webhook
# Usage: ./scripts/discord-webhook.sh <type> <title> <message>
# Types: bug, suggestion, question, feedback, alert
#
# Environment variables:
#   DISCORD_WEBHOOK_URL — Discord webhook URL (required)
#   DISCORD_BUG_WEBHOOK_URL — Optional: separate webhook for bugs
#   DISCORD_FEEDBACK_WEBHOOK_URL — Optional: separate webhook for feedback

set -euo pipefail

TYPE="${1:-feedback}"
TITLE="${2:-No title}"
MESSAGE="${3:-No message}"
MODULE="${4:-general}"
SEVERITY="${5:-medium}"

# Select webhook URL based on type
case "$TYPE" in
  bug)
    WEBHOOK_URL="${DISCORD_BUG_WEBHOOK_URL:-$DISCORD_WEBHOOK_URL}"
    EMOJI="🐛"
    COLOR=15548997  # Red
    ;;
  suggestion)
    WEBHOOK_URL="${DISCORD_FEEDBACK_WEBHOOK_URL:-$DISCORD_WEBHOOK_URL}"
    EMOJI="💡"
    COLOR=16776960  # Yellow
    ;;
  question)
    WEBHOOK_URL="${DISCORD_WEBHOOK_URL}"
    EMOJI="❓"
    COLOR=3447003  # Blue
    ;;
  feedback)
    WEBHOOK_URL="${DISCORD_FEEDBACK_WEBHOOK_URL:-$DISCORD_WEBHOOK_URL}"
    EMOJI="⭐"
    COLOR=3066993  # Green
    ;;
  alert)
    WEBHOOK_URL="${DISCORD_WEBHOOK_URL}"
    EMOJI="🚨"
    COLOR=15158332  # Dark Red
    ;;
  *)
    echo "Unknown type: $TYPE"
    echo "Usage: $0 <bug|suggestion|question|feedback|alert> <title> <message> [module] [severity]"
    exit 1
    ;;
esac

if [ -z "${WEBHOOK_URL:-}" ]; then
  echo "ERROR: DISCORD_WEBHOOK_URL not set"
  echo "Set it in your .env or export it:"
  echo "  export DISCORD_WEBHOOK_URL='https://discord.com/api/webhooks/...'"
  exit 1
fi

# Build severity emoji
case "$SEVERITY" in
  critical|high) SEV_EMOJI="🔴" ;;
  medium)        SEV_EMOJI="🟡" ;;
  low)           SEV_EMOJI="🟢" ;;
  *)             SEV_EMOJI="⚪" ;;
esac

# Get timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Build Discord embed (avoid special chars in values for Windows compat)
PAYLOAD=$(cat <<EOF
{
  "embeds": [{
    "title": "${EMOJI} ${TITLE}",
    "description": "${MESSAGE}",
    "color": ${COLOR},
    "fields": [
      {
        "name": "Tipo",
        "value": "${TYPE}",
        "inline": true
      },
      {
        "name": "Modulo",
        "value": "${MODULE}",
        "inline": true
      },
      {
        "name": "Severidade",
        "value": "${SEV_EMOJI} ${SEVERITY}",
        "inline": true
      }
    ],
    "timestamp": "${TIMESTAMP}",
    "footer": {
      "text": "CloudBuilder MVP Feedback"
    }
  }]
}
EOF
)

# Send to Discord
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  "$WEBHOOK_URL")

if [ "$HTTP_CODE" = "204" ] || [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Sent to Discord: ${EMOJI} ${TITLE}"
else
  echo "❌ Failed to send (HTTP $HTTP_CODE)"
  exit 1
fi
