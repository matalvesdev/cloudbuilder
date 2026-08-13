#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# CloudBuilder Discord — Invite Link Generator
# ═══════════════════════════════════════════════════════════════
# Generates invite links and QR codes for the Discord server
# Run: bash generate-invite.sh
# ═══════════════════════════════════════════════════════════════

set -e

echo "🔗 CloudBuilder Discord — Invite Generator"
echo "═══════════════════════════════════════════════════════════════"

# Configuration
DISCORD_SERVER_ID="${DISCORD_SERVER_ID:-}"
DISCORD_BOT_TOKEN="${DISCORD_BOT_TOKEN:-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check prerequisites
if [ -z "$DISCORD_SERVER_ID" ]; then
    echo -e "${YELLOW}⚠️  DISCORD_SERVER_ID not set${NC}"
    echo "   Set it: export DISCORD_SERVER_ID=your_server_id"
    echo ""
    echo "   To find your server ID:"
    echo "   1. Enable Developer Mode in Discord"
    echo "   2. Right-click server name → Copy Server ID"
    echo ""
fi

if [ -z "$DISCORD_BOT_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  DISCORD_BOT_TOKEN not set${NC}"
    echo "   Set it: export DISCORD_BOT_TOKEN=your_bot_token"
    echo ""
    echo "   To get a bot token:"
    echo "   1. Go to https://discord.com/developers/applications"
    echo "   2. Create application → Bot → Copy Token"
    echo ""
fi

# Generate invite link
echo ""
echo "📋 Generating invite links..."
echo ""

# Method 1: Direct invite link (no API needed)
echo -e "${BLUE}1. Direct Invite Link (no API):${NC}"
echo "   https://discord.gg/cloudbuilder"
echo ""

# Method 2: API-generated invite (requires bot token)
if [ -n "$DISCORD_BOT_TOKEN" ] && [ -n "$DISCORD_SERVER_ID" ]; then
    echo -e "${BLUE}2. API-Generated Invite:${NC}"
    
    RESPONSE=$(curl -s -X POST \
        "https://discord.com/api/v10/channels/${DISCORD_SERVER_ID}/invites" \
        -H "Authorization: Bot ${DISCORD_BOT_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{"max_age":0,"max_uses":0,"temporary":false}')
    
    if echo "$RESPONSE" | grep -q '"code"'; then
        INVITE_CODE=$(echo "$RESPONSE" | grep -o '"code":"[^"]*"' | cut -d'"' -f4)
        echo "   https://discord.gg/${INVITE_CODE}"
        echo -e "   ${GREEN}✅ Permanent invite created${NC}"
    else
        echo -e "   ${RED}❌ Error: $RESPONSE${NC}"
    fi
    echo ""
fi

# Generate QR code (if qrencode is installed)
echo -e "${BLUE}3. QR Code:${NC}"
if command -v qrencode &> /dev/null; then
    echo "   Generating QR code..."
    qrencode -t UTF8 "https://discord.gg/cloudbuilder"
    echo ""
    echo "   Save as image:"
    echo "   qrencode -o discord-invite.png 'https://discord.gg/cloudbuilder'"
else
    echo "   Install qrencode for QR codes:"
    echo "   - Windows: choco install qrencode"
    echo "   - macOS: brew install qrencode"
    echo "   - Linux: apt install qrencode"
fi
echo ""

# Generate social media links
echo -e "${BLUE}4. Social Media Links:${NC}"
echo "   Twitter/X: https://twitter.com/intent/tweet?text=Join%20the%20CloudBuilder%20community!&url=https://discord.gg/cloudbuilder"
echo "   LinkedIn: https://www.linkedin.com/sharing/share-offsite/?url=https://discord.gg/cloudbuilder"
echo "   Reddit: https://reddit.com/submit?url=https://discord.gg/cloudbuilder&title=Join%20CloudBuilder%20Discord"
echo ""

# Generate email signature
echo -e "${BLUE}5. Email Signature:${NC}"
echo "   ─────────────────────────────────────"
echo "   Join our Discord community: discord.gg/cloudbuilder"
echo "   ─────────────────────────────────────"
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "✅ Done! Use these links to invite members."
echo ""
echo "Next steps:"
echo "1. Share the invite link in your first blog post"
echo "2. Add it to your email signature"
echo "3. Post on social media"
echo "4. Include in newsletter"
echo "═══════════════════════════════════════════════════════════════"
