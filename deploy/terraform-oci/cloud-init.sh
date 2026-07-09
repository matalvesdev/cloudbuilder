#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# CloudBuilder — Cloud-Init Script
# ═══════════════════════════════════════════════════════════════════════════
# Runs on first boot via Terraform user_data.
# Installs Docker, clones repo, starts services.
# ═══════════════════════════════════════════════════════════════════════════

set -e

LOG="/var/log/cloudbuilder-setup.log"
exec > >(tee -a $LOG) 2>&1

echo "═══════════════════════════════════════════════════════════════"
echo "  CloudBuilder — Cloud-Init Starting"
echo "  $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "═══════════════════════════════════════════════════════════════"

# ─── 1. System Update ───────────────────────────────────────────────────────
echo ""
echo "▶ [1/8] Updating system..."
apt-get update -qq
apt-get upgrade -y -qq

# ─── 2. Install Dependencies ───────────────────────────────────────────────
echo ""
echo "▶ [2/8] Installing dependencies..."
apt-get install -y -qq \
    curl \
    wget \
    git \
    jq \
    openssl \
    ca-certificates \
    gnupg \
    lsb-release

# ─── 3. Install Docker ─────────────────────────────────────────────────────
echo ""
echo "▶ [3/8] Installing Docker..."
if command -v docker &> /dev/null; then
    echo "  Docker already installed"
else
    curl -fsSL https://get.docker.com | sh
    usermod -aG docker ubuntu
    systemctl enable docker
    systemctl start docker
    echo "  Docker installed: $(docker --version)"
fi

# ─── 4. Install Docker Compose Plugin ──────────────────────────────────────
echo ""
echo "▶ [4/8] Installing Docker Compose plugin..."
if docker compose version &> /dev/null; then
    echo "  Docker Compose already installed"
else
    apt-get install -y docker-compose-plugin
fi

# ─── 5. Install Cloudflare Tunnel ──────────────────────────────────────────
echo ""
echo "▶ [5/8] Installing cloudflared..."
if command -v cloudflared &> /dev/null; then
    echo "  cloudflared already installed"
else
    curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 \
        -o /usr/local/bin/cloudflared
    chmod +x /usr/local/bin/cloudflared
    echo "  cloudflared installed: $(cloudflared --version)"
fi

# ─── 6. Clone Repository ──────────────────────────────────────────────────
echo ""
echo "▶ [6/8] Cloning CloudBuilder..."
if [ -d "/opt/cloudbuilder" ]; then
    echo "  Repository exists, pulling latest..."
    cd /opt/cloudbuilder && git pull
else
    git clone https://github.com/YOUR_USER/CloudBuilder.git /opt/cloudbuilder
    cd /opt/cloudbuilder
fi

# ─── 7. Generate Secrets ──────────────────────────────────────────────────
echo ""
echo "▶ [7/8] Generating secrets..."
if [ ! -f "/opt/cloudbuilder/.env" ]; then
    JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    ENCRYPTION_KEY=$(openssl rand -base64 64 | tr -d '\n')
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
    JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')

    cat > /opt/cloudbuilder/.env << ENVEOF
# CloudBuilder Beta — Auto-generated $(date -u +"%Y-%m-%dT%H:%M:%SZ")
JWT_SECRET=$JWT_SECRET
CLOUDBUILDER_ENCRYPTION_KEY=$ENCRYPTION_KEY
DB_PASSWORD=$DB_PASSWORD
SPRING_PROFILES_ACTIVE=beta
ENVEOF

    chmod 600 /opt/cloudbuilder/.env
    echo "  Secrets generated"
else
    echo "  .env already exists"
fi

# ─── 8. Start Services ────────────────────────────────────────────────────
echo ""
echo "▶ [8/8] Building and starting CloudBuilder..."
cd /opt/cloudbuilder

# Build and start all services
docker compose up -d --build

# Wait for backend to be healthy
echo "Waiting for backend to be healthy..."
for i in $(seq 1 60); do
    if curl -sf http://localhost:8080/actuator/health > /dev/null 2>&1; then
        echo "  Backend is healthy!"
        break
    fi
    sleep 5
    echo "  Waiting... ($i/60)"
done

# ─── Start Cloudflare Tunnel (background) ──────────────────────────────────
echo ""
echo "Starting Cloudflare tunnel..."
nohup cloudflared tunnel --url http://localhost:3000 > /var/log/cloudbuilder-tunnel.log 2>&1 &
TUNNEL_PID=$!
echo "  Tunnel PID: $TUNNEL_PID"

# Extract tunnel URL
sleep 10
TUNNEL_URL=$(grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' /var/log/cloudbuilder-tunnel.log | head -1)

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  CloudBuilder Deploy Complete!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  Local:    http://localhost:3000"
echo "  Public:   $TUNNEL_URL"
echo "  API:      http://$(curl -s ifconfig.me):8080/api/v1"
echo ""
echo "  SSH:      ssh ubuntu@$(curl -s ifconfig.me)"
echo ""
echo "  Logs:     docker compose logs -f"
echo "  Status:   docker compose ps"
echo "  Stop:     docker compose down"
echo "═══════════════════════════════════════════════════════════════"

# Write URL to a file for easy access
echo "$TUNNEL_URL" > /opt/cloudbuilder/TUNNEL_URL
