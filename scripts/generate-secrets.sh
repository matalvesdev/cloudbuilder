#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# CloudBuilder — Secret Generator
# ═══════════════════════════════════════════════════════════════
# Generates secure secrets for the project
# Run: bash scripts/generate-secrets.sh
# ═══════════════════════════════════════════════════════════════

set -e

echo "🔐 CloudBuilder — Secret Generator"
echo "═══════════════════════════════════════════════════════════════"

# Check prerequisites
command -v openssl >/dev/null 2>&1 || { echo "❌ openssl not found"; exit 1; }

echo ""
echo "📋 Generating secrets..."
echo ""

# JWT Secret (64 bytes base64)
JWT_SECRET=$(openssl rand -base64 64)
echo "JWT_SECRET=$JWT_SECRET"
echo ""

# Encryption Key (64 bytes base64)
ENCRYPTION_KEY=$(openssl rand -base64 64)
echo "CLOUDBUILDER_ENCRYPTION_KEY=$ENCRYPTION_KEY"
echo ""

# Database Password (32 bytes hex)
DB_PASSWORD=$(openssl rand -hex 16)
echo "DB_PASSWORD=$DB_PASSWORD"
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "✅ Secrets generated!"
echo ""
echo "⚠️  IMPORTANT: Save these secrets securely!"
echo "   - Add to GitHub Secrets (Settings → Secrets → Actions)"
echo "   - Add to Railway Variables (Dashboard → Variables)"
echo "   - NEVER commit to git"
echo ""
echo "GitHub Secrets to add:"
echo "  JWT_SECRET"
echo "  CLOUDBUILDER_ENCRYPTION_KEY"
echo "  DB_PASSWORD"
echo "═══════════════════════════════════════════════════════════════"
