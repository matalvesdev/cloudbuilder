#!/usr/bin/env bash
# setup-discord-bot.sh — Run Discord bot to create channels and roles
# Usage: ./scripts/setup-discord-bot.sh <BOT_TOKEN> <SERVER_ID>

set -euo pipefail

BOT_TOKEN="${1:-}"
SERVER_ID="${2:-}"

if [ -z "$BOT_TOKEN" ]; then
  echo "❌ Usage: $0 <BOT_TOKEN> <SERVER_ID>"
  echo ""
  echo "To get a Bot Token:"
  echo "1. Go to https://discord.com/developers/applications"
  echo "2. Create New Application → Bot → Copy Token"
  echo "3. Enable Message Content Intent"
  echo "4. OAuth2 → URL Generator → Select bot → Administrator"
  echo "5. Open URL and invite to your server"
  exit 1
fi

if [ -z "$SERVER_ID" ]; then
  echo "❌ Usage: $0 <BOT_TOKEN> <SERVER_ID>"
  echo ""
  echo "To get Server ID:"
  echo "1. Open Discord → Server Settings → Advanced"
  echo "2. Enable Developer Mode"
  echo "3. Right-click server name → Copy Server ID"
  exit 1
fi

echo "═══════════════════════════════════════════════════════════"
echo "  🤖 CloudBuilder Discord Bot Setup"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Server ID: $SERVER_ID"
echo ""

# Check if discord.py is installed
if ! python3 -c "import discord" 2>/dev/null; then
  echo "📦 Installing discord.py..."
  pip install discord.py
fi

# Run the bot
echo "🚀 Running bot setup..."
export DISCORD_BOT_TOKEN="$BOT_TOKEN"
python3 "$(dirname "$0")/../geos/content/discord/setup-bot.py" --server-id="$SERVER_ID"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ Setup complete!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 Next steps:"
echo "1. Create webhooks in each channel"
echo "2. Run: ./scripts/setup-discord-webhooks.sh"
echo ""
