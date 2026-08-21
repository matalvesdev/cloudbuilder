#!/usr/bin/env bash
# slack-webhook.sh — Send feedback/bug reports to Slack via webhook
# Usage: ./scripts/slack-webhook.sh <type> <title> <message>
# Types: bug, suggestion, question, feedback, alert
#
# Environment variables:
#   SLACK_WEBHOOK_URL — Slack webhook URL (required)
#   SLACK_BUG_WEBHOOK_URL — Optional: separate webhook for bugs
#   SLACK_FEEDBACK_WEBHOOK_URL — Optional: separate webhook for feedback

set -euo pipefail

TYPE="${1:-feedback}"
TITLE="${2:-No title}"
MESSAGE="${3:-No message}"
MODULE="${4:-general}"
SEVERITY="${5:-medium}"

# Select webhook URL based on type
case "$TYPE" in
  bug)
    WEBHOOK_URL="${SLACK_BUG_WEBHOOK_URL:-$SLACK_WEBHOOK_URL}"
    EMOJI=":bug:"
    COLOR="#dc3545"  # Red
    ;;
  suggestion)
    WEBHOOK_URL="${SLACK_FEEDBACK_WEBHOOK_URL:-$SLACK_WEBHOOK_URL}"
    EMOJI=":bulb:"
    COLOR="#ffc107"  # Yellow
    ;;
  question)
    WEBHOOK_URL="${SLACK_WEBHOOK_URL}"
    EMOJI=":question:"
    COLOR="#007bff"  # Blue
    ;;
  feedback)
    WEBHOOK_URL="${SLACK_FEEDBACK_WEBHOOK_URL:-$SLACK_WEBHOOK_URL}"
    EMOJI=":star:"
    COLOR="#28a745"  # Green
    ;;
  alert)
    WEBHOOK_URL="${SLACK_WEBHOOK_URL}"
    EMOJI=":rotating_light:"
    COLOR="#dc3545"  # Dark Red
    ;;
  *)
    echo "Unknown type: $TYPE"
    echo "Usage: $0 <bug|suggestion|question|feedback|alert> <title> <message> [module] [severity]"
    exit 1
    ;;
esac

if [ -z "${WEBHOOK_URL:-}" ]; then
  echo "ERROR: SLACK_WEBHOOK_URL not set"
  echo "Set it in your .env or export it:"
  echo "  export SLACK_WEBHOOK_URL='https://hooks.slack.com/services/...'"
  exit 1
fi

# Build severity emoji
case "$SEVERITY" in
  critical|high) SEV_EMOJI=":red_circle:" ;;
  medium)        SEV_EMOJI=":large_orange_circle:" ;;
  low)           SEV_EMOJI=":large_green_circle:" ;;
  *)             SEV_EMOJI=":white_circle:" ;;
esac

# Get timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Build Slack message
PAYLOAD=$(cat <<EOF
{
  "attachments": [{
    "color": "${COLOR}",
    "title": "${EMOJI} ${TITLE}",
    "text": "${MESSAGE}",
    "fields": [
      {
        "title": "Tipo",
        "value": "${TYPE}",
        "short": true
      },
      {
        "title": "Módulo",
        "value": "${MODULE}",
        "short": true
      },
      {
        "title": "Severidade",
        "value": "${SEV_EMOJI} ${SEVERITY}",
        "short": true
      }
    ],
    "footer": "CloudBuilder MVP Feedback",
    "ts": $(date +%s)
  }]
}
EOF
)

# Send to Slack
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  "$WEBHOOK_URL")

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Sent to Slack: ${EMOJI} ${TITLE}"
else
  echo "❌ Failed to send (HTTP $HTTP_CODE)"
  exit 1
fi
