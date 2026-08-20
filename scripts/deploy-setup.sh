#!/bin/bash
# ============================================================================
# CloudBuilder — Deploy Setup Script
# ============================================================================
# Generates secrets and displays deployment instructions.
# Run this before deploying to Render + Vercel + Neon.
# ============================================================================

set -e

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         CloudBuilder — Deploy Setup                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Generate secrets
JWT_SECRET=$(openssl rand -base64 64 2>/dev/null || head -c 64 /dev/urandom | base64)
ENCRYPTION_KEY=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)

echo "🔐 Secrets gerados:"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "JWT_SECRET:"
echo "$JWT_SECRET"
echo ""
echo "CLOUDBUILDER_ENCRYPTION_KEY:"
echo "$ENCRYPTION_KEY"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Create .env file
cat > .env.deploy << EOF
# CloudBuilder Deploy Variables
# Generated: $(date)

# Database (Neon)
DATABASE_URL=postgresql://USER:PASSWORD@HOST/cloudbuilder?sslmode=require

# Security
JWT_SECRET=$JWT_SECRET
CLOUDBUILDER_ENCRYPTION_KEY=$ENCRYPTION_KEY

# Backend (Render)
SERVER_PORT=10000
SPRING_PROFILES_ACTIVE=prod
CORS_ALLOWED_ORIGINS=https://YOUR-APP.vercel.app
JAVA_OPTS=-Xmx256m -Xms128m

# Frontend (Vercel)
VITE_API_URL=https://YOUR-APP.onrender.com/api/v1
EOF

echo "📄 Arquivo .env.deploy criado com as variáveis."
echo ""

echo "📋 Próximos passos:"
echo ""
echo "1. Neon (Banco de Dados)"
echo "   → Acesse: https://neon.tech"
echo "   → Crie projeto 'cloudbuilder'"
echo "   → Copie a connection string"
echo "   → Atualize DATABASE_URL no .env.deploy"
echo ""
echo "2. Render (Backend)"
echo "   → Acesse: https://render.com"
echo "   → New + → Web Service"
echo "   → Dockerfile: backend/Dockerfile"
echo "   → Adicione as variáveis do .env.deploy"
echo ""
echo "3. Vercel (Frontend)"
echo "   → Acesse: https://vercel.com"
echo "   → Add New → Project"
echo "   → Root Directory: frontend"
echo "   → VITE_API_URL=https://SEU-APP.onrender.com/api/v1"
echo ""
echo "4. Atualize CORS"
echo "   → Após deploy do Vercel, atualize CORS_ALLOWED_ORIGINS no Render"
echo ""
echo "5. Teste"
echo "   → Login: admin@cloudbuilder.dev / Admin@123"
echo ""

# Verify tools
echo "🔍 Verificando ferramentas..."
if command -v git &> /dev/null; then
    echo "   ✅ Git $(git --version | cut -d' ' -f3)"
else
    echo "   ❌ Git não encontrado"
fi

if command -v docker &> /dev/null; then
    echo "   ✅ Docker $(docker --version | cut -d' ' -f3)"
else
    echo "   ⚠️  Docker não encontrado (opcional para deploy)"
fi

echo ""
echo "✅ Setup completo! Siga os passos acima."
echo ""
