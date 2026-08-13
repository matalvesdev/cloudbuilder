#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# CloudBuilder — Deployment Setup Script (Free Tier)
# ═══════════════════════════════════════════════════════════════
# Sets up GitHub Pages deployment for frontend (100% free)
# Run from project root: bash scripts/deploy-setup.sh
# ═══════════════════════════════════════════════════════════════

set -e

echo "🚀 CloudBuilder — Deploy Setup (Free Tier)"
echo "═══════════════════════════════════════════════════════════════"

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js não encontrado. Instale: https://nodejs.org"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm não encontrado."; exit 1; }

echo ""
echo "📋 Pré-requisitos verificados:"
echo "   ✅ Node.js $(node --version)"
echo "   ✅ npm $(npm --version)"

# Check GitHub CLI
echo ""
if command -v gh &> /dev/null; then
    echo "✅ GitHub CLI encontrado"
    echo "   Versão: $(gh --version | head -1)"
else
    echo "⚠️  GitHub CLI não encontrado"
    echo "   Instale: https://cli.github.com/"
    echo "   Windows: winget install GitHub.cli"
    echo "   macOS: brew install gh"
    echo "   Linux: sudo apt install gh"
fi

# Enable GitHub Pages
echo ""
echo "📄 Para habilitar GitHub Pages:"
echo "1. Vá em Settings → Pages no repositório"
echo "2. Em Source, selecione 'GitHub Actions'"
echo "3. Push no main ativa deploy automático"
echo ""

# Test build locally
echo "🔨 Testando build local..."
cd frontend
npm run build

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ Setup concluído!"
echo ""
echo "Deploy:"
echo "- Automático: push no branch main"
echo "- Manual: GitHub Actions → Run workflow"
echo ""
echo "URLs:"
echo "- GitHub Pages: https://<user>.github.io/cloudbuilder/"
echo "- Domínio próprio: configure DNS para GitHub Pages"
echo ""
echo "Custo total: $0 (GitHub Pages + Railway free tier)"
echo "═══════════════════════════════════════════════════════════════"
