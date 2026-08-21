#!/usr/bin/env bash
# deploy-setup.sh — Automated deploy setup for CloudBuilder MVP
# Usage: ./scripts/deploy-setup.sh

set -euo pipefail

echo "═══════════════════════════════════════════════════════════"
echo "  🚀 CloudBuilder MVP — Deploy Setup"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# ── Step 1: Collect credentials ────────────────────────────
echo "📋 Passo 1: Credenciais"
echo "─────────────────────────────────────"
echo ""

read -r -p "Neon DATABASE_URL (postgresql://...): " DATABASE_URL
read -r -p "Vercel URL (https://seu-app.vercel.app): " FRONTEND_URL

# Generate secrets if not provided
if [ -z "${JWT_SECRET:-}" ]; then
  JWT_SECRET=$(openssl rand -base64 64 2>/dev/null || head -c 64 /dev/urandom | base64)
fi

if [ -z "${ENCRYPTION_KEY:-}" ]; then
  ENCRYPTION_KEY=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
fi

echo ""
echo "─────────────────────────────────────"

# ── Step 2: Create .env.deploy ─────────────────────────────
echo ""
echo "📝 Passo 2: Criando .env.deploy"
echo "─────────────────────────────────────"

cat > .env.deploy <<EOF
# ═══════════════════════════════════════════════════════════
# CloudBuilder MVP — Deploy Environment
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# ═══════════════════════════════════════════════════════════

# ── Backend (Render) ──────────────────────────────────────
DATABASE_URL=${DATABASE_URL}
JWT_SECRET=${JWT_SECRET}
CLOUDBUILDER_ENCRYPTION_KEY=${ENCRYPTION_KEY}
SERVER_PORT=10000
SPRING_PROFILES_ACTIVE=prod
CORS_ALLOWED_ORIGINS=${FRONTEND_URL}
JAVA_OPTS=-Xmx256m -Xms128m

# ── Frontend (Vercel) ─────────────────────────────────────
VITE_API_URL=${FRONTEND_URL%/*}/api/v1

# ── Discord (optional) ────────────────────────────────────
DISCORD_WEBHOOK_URL=
DISCORD_BUG_WEBHOOK_URL=
DISCORD_FEEDBACK_WEBHOOK_URL=
EOF

echo "  ✅ .env.deploy criado"

# ── Step 3: Create Render config ───────────────────────────
echo ""
echo "📝 Passo 3: Criando render.yaml"
echo "─────────────────────────────────────"

cat > render.yaml <<EOF
services:
  - type: web
    name: cloudbuilder-api
    runtime: docker
    dockerfilePath: backend/Dockerfile
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: CLOUDBUILDER_ENCRYPTION_KEY
        generateValue: true
      - key: SERVER_PORT
        value: 10000
      - key: SPRING_PROFILES_ACTIVE
        value: prod
      - key: CORS_ALLOWED_ORIGINS
        value: ${FRONTEND_URL}
      - key: JAVA_OPTS
        value: -Xmx256m -Xms128m
    plan: free
    healthCheckPath: /actuator/health
EOF

echo "  ✅ render.yaml criado"

# ── Step 4: Create Vercel config ───────────────────────────
echo ""
echo "📝 Passo 4: Criando vercel.json"
echo "─────────────────────────────────────"

cat > frontend/vercel.json <<EOF
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
EOF

echo "  ✅ vercel.json criado"

# ── Step 5: Summary ────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ Configuração pronta!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 Próximos passos:"
echo ""
echo "  1. Neon (Banco de Dados):"
echo "     - Acesse https://neon.tech"
echo "     - Crie projeto 'cloudbuilder'"
echo "     - Cole a connection string no .env.deploy"
echo ""
echo "  2. Render (Backend):"
echo "     - Acesse https://render.com"
echo "     - New + → Web Service"
echo "     - Selecione repositório GitHub"
echo "     - Runtime: Docker"
echo "     - Dockerfile: backend/Dockerfile"
echo "     - Adicione variáveis do .env.deploy"
echo ""
echo "  3. Vercel (Frontend):"
echo "     - Acesse https://vercel.com"
echo "     - Add New → Project"
echo "     - Root Directory: frontend"
echo "     - VITE_API_URL: https://cloudbuilder-api.onrender.com/api/v1"
echo ""
echo "  4. CORS:"
echo "     - Atualize CORS_ALLOWED_ORIGINS no Render"
echo "     - Valor: https://seu-app.vercel.app"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  📧 Links para testers (após deploy):"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  Alpha: ${FRONTEND_URL}/?authMode=invite&token=invite-token-alpha-001"
echo "  Beta:  ${FRONTEND_URL}/?authMode=invite&token=invite-token-beta-001"
echo "  Gamma: ${FRONTEND_URL}/?authMode=invite&token=invite-token-gamma-001"
echo ""
echo "═══════════════════════════════════════════════════════════"
