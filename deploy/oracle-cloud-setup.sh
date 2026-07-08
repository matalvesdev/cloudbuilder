#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# CloudBuilder — Oracle Cloud Free Tier Setup Script
# ═══════════════════════════════════════════════════════════════════════════
# Run this ONCE after creating the Oracle Cloud ARM instance
# Usage: ssh oracle-cloud && bash oracle-cloud-setup.sh
# ═══════════════════════════════════════════════════════════════════════════

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "  CloudBuilder — Oracle Cloud Free Tier Setup"
echo "═══════════════════════════════════════════════════════════════"

# ─── 1. System Update ───────────────────────────────────────────────────────
echo ""
echo "▶ [1/7] Updating system packages..."
sudo apt-get update -qq && sudo apt-get upgrade -y -qq

# ─── 2. Install Docker ──────────────────────────────────────────────────────
echo ""
echo "▶ [2/7] Installing Docker..."
if command -v docker &> /dev/null; then
    echo "  Docker already installed: $(docker --version)"
else
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    echo "  Docker installed: $(docker --version)"
fi

# ─── 3. Install Docker Compose ──────────────────────────────────────────────
echo ""
echo "▶ [3/7] Installing Docker Compose..."
if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
    echo "  Docker Compose already installed"
else
    sudo apt-get install -y docker-compose-plugin
fi

# ─── 4. Install Cloudflare Tunnel ───────────────────────────────────────────
echo ""
echo "▶ [4/7] Installing Cloudflare Tunnel (cloudflared)..."
if command -v cloudflared &> /dev/null; then
    echo "  cloudflared already installed"
else
    curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 -o /tmp/cloudflared
    sudo mv /tmp/cloudflared /usr/local/bin/cloudflared
    sudo chmod +x /usr/local/bin/cloudflared
    echo "  cloudflared installed: $(cloudflared --version)"
fi

# ─── 5. Clone Repository ───────────────────────────────────────────────────
echo ""
echo "▶ [5/7] Cloning CloudBuilder repository..."
if [ -d "/opt/cloudbuilder" ]; then
    echo "  Repository already exists at /opt/cloudbuilder"
    cd /opt/cloudbuilder && git pull
else
    sudo mkdir -p /opt
    sudo chown $USER:$USER /opt
    # Replace with your actual repo URL
    git clone https://github.com/YOUR_USER/CloudBuilder.git /opt/cloudbuilder
    cd /opt/cloudbuilder
fi

# ─── 6. Generate Secrets ───────────────────────────────────────────────────
echo ""
echo "▶ [6/7] Generating secrets..."
if [ -f "/opt/cloudbuilder/.env" ]; then
    echo "  .env already exists, skipping generation"
    echo "  To regenerate: rm /opt/cloudbuilder/.env && re-run this script"
else
    JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    ENCRYPTION_KEY=$(openssl rand -base64 64 | tr -d '\n')
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')

    cat > /opt/cloudbuilder/.env << EOF
# CloudBuilder Beta — Auto-generated secrets
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

# JWT Secret (HS256, 64 bytes)
JWT_SECRET=${JWT_SECRET}

# AES-256-GCM Encryption Key
CLOUDBUILDER_ENCRYPTION_KEY=${ENCRYPTION_KEY}

# PostgreSQL Password
DB_PASSWORD=${DB_PASSWORD}

# Spring Profile
SPRING_PROFILES_ACTIVE=beta
EOF

    chmod 600 /opt/cloudbuilder/.env
    echo "  Secrets generated and saved to .env"
fi

# ─── 7. Start Services ─────────────────────────────────────────────────────
echo ""
echo "▶ [7/7] Building and starting services..."
cd /opt/cloudbuilder
docker compose up -d --build

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  CloudBuilder is running!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  Local access: http://localhost:3000"
echo "  API:          http://localhost:8080/api/v1"
echo ""
echo "  To expose publicly, run:"
echo "    cloudflared tunnel --url http://localhost:3000"
echo ""
echo "  To check logs:"
echo "    docker compose logs -f"
echo ""
echo "  To stop:"
echo "    docker compose down"
echo "═══════════════════════════════════════════════════════════════"
