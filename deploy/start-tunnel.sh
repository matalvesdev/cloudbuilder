#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# CloudBuilder — Expose via Cloudflare Tunnel (Quick Start)
# ═══════════════════════════════════════════════════════════════════════════
# Creates a temporary public URL for the CloudBuilder frontend.
# No Cloudflare account needed — uses "quick tunnel" (trycloudflare.com).
#
# Usage: bash start-tunnel.sh
# Output: A https://xxx.trycloudflare.com URL to share with testers
# ═══════════════════════════════════════════════════════════════════════════

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "  CloudBuilder — Starting Public Tunnel"
echo "═══════════════════════════════════════════════════════════════"

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "Installing cloudflared..."
    curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /tmp/cloudflared
    sudo mv /tmp/cloudflared /usr/local/bin/cloudflared
    sudo chmod +x /usr/local/bin/cloudflared
fi

# Check if services are running
if ! docker compose ps | grep -q "Up"; then
    echo "Starting CloudBuilder services..."
    cd /opt/cloudbuilder
    docker compose up -d
    echo "Waiting for services to be healthy..."
    sleep 30
fi

echo ""
echo "Starting tunnel to http://localhost:3000..."
echo "Share the URL below with your testers:"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Start the quick tunnel (no account needed)
cloudflared tunnel --url http://localhost:3000

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Tunnel stopped."
echo "═══════════════════════════════════════════════════════════════"
