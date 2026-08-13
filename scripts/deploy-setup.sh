#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# CloudBuilder — Deployment Setup Script
# ═══════════════════════════════════════════════════════════════
# Sets up Vercel deployment for frontend
# Run from project root: bash scripts/deploy-setup.sh
# ═══════════════════════════════════════════════════════════════

set -e

echo "🚀 CloudBuilder — Deploy Setup"
echo "═══════════════════════════════════════════════════════════════"

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js não encontrado. Instale: https://nodejs.org"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm não encontrado."; exit 1; }

echo ""
echo "📋 Pré-requisitos verificados:"
echo "   ✅ Node.js $(node --version)"
echo "   ✅ npm $(npm --version)"

# Install Vercel CLI
echo ""
echo "📦 Instalando Vercel CLI..."
npm install -g vercel@latest 2>/dev/null

# Link to Vercel
echo ""
echo "🔗 Conectando ao Vercel..."
echo "   Abra o link abaixo no navegador e faça login:"
echo ""
cd frontend
vercel link

# Get project info
echo ""
echo "📋 Informações do projeto:"
cat .vercel/project.json

# Set environment variables
echo ""
echo "🔧 Configurando variáveis de ambiente..."
echo "   Adicione no dashboard do Vercel:"
echo "   - VITE_API_URL=https://api.cloudbuilder.dev/api/v1"
echo "   - VITE_PLUNK_API_KEY=pk_..."
echo ""

# Test build
echo "🔨 Testando build..."
npm run build

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ Setup concluído!"
echo ""
echo "Próximos passos:"
echo "1. Configure o domínio no Vercel: Settings → Domains"
echo "2. Adicione os DNS records:"
echo "   A    @       76.76.21.21"
echo "   CNAME www    cname.vercel-dns.com"
echo "3. Configure GitHub Secrets (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID)"
echo "4. Faça push para main para deploy automático"
echo ""
echo "Deploy manual: cd frontend && npx vercel --prod"
echo "═══════════════════════════════════════════════════════════════"
