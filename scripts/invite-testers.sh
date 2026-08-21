#!/usr/bin/env bash
# invite-testers.sh — Send invitations to testers via API
# Usage: ./scripts/invite-testers.sh [backend-url]
# Default: http://localhost:8080

set -euo pipefail

BACKEND_URL="${1:-http://localhost:8080}"
ORG_ID="org-seed-001"
ADMIN_EMAIL="admin@cloudbuilder.dev"
ADMIN_PASSWORD="Admin@123"

echo "═══════════════════════════════════════════════════════════"
echo "  📧 Convites para Testers — CloudBuilder"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Backend: $BACKEND_URL"
echo "Organização: $ORG_ID"
echo ""

# ── Step 1: Login as admin ──────────────────────────────────
echo "🔑 Fazendo login como admin..."

LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" 2>/dev/null)

if [ $? -ne 0 ] || [ -z "$LOGIN_RESPONSE" ]; then
  echo "❌ Erro ao conectar ao backend. Verifique se está rodando."
  echo "   Execute: cd CloudBuilder && docker compose up -d"
  exit 1
fi

TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null || echo "")

if [ -z "$TOKEN" ]; then
  echo "❌ Erro ao obter token. Verifique as credenciais."
  echo "   Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login realizado com sucesso!"
echo ""

# ── Step 2: Define testers ──────────────────────────────────
echo "📋 Definindo testers..."
echo ""

# Tester configurations
declare -a TESTER_NAMES=("Tester Alpha" "Tester Beta" "Tester Gamma")
declare -a TESTER_EMAILS=("tester-alpha@cloudbuilder.dev" "tester-beta@cloudbuilder.dev" "tester-gamma@cloudbuilder.dev")
declare -a TESTER_ROLES=("editor" "editor" "viewer")
declare -a TESTER_DESCRIPTIONS=("DevOps/SRE — Testes de provisioning" "Developer — Testes de canvas e UX" "Viewer — Testes de navegação e docs")

# ── Step 3: Send invitations ─────────────────────────────────
echo "═══════════════════════════════════════════════════════════"
echo "  📨 Enviando convites..."
echo "═══════════════════════════════════════════════════════════"
echo ""

INVITED=0
FAILED=0

for i in "${!TESTER_EMAILS[@]}"; do
  NAME="${TESTER_NAMES[$i]}"
  EMAIL="${TESTER_EMAILS[$i]}"
  ROLE="${TESTER_ROLES[$i]}"
  DESC="${TESTER_DESCRIPTIONS[$i]}"

  echo "─────────────────────────────────────"
  echo "👤 $NAME"
  echo "   Email: $EMAIL"
  echo "   Role: $ROLE"
  echo "   Focus: $DESC"
  echo ""

  # Send invitation
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    "$BACKEND_URL/api/v1/organizations/$ORG_ID/invitations" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"email\":\"$EMAIL\",\"role\":\"$ROLE\"}" 2>/dev/null)

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | head -n -1)

  if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    # Extract invitation token
    TOKEN_INVITE=$(echo "$BODY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', 'N/A'))" 2>/dev/null || echo "N/A")
    
    echo "   ✅ Convite enviado!"
    echo "   🔗 Link: $BACKEND_URL/?authMode=invite&token=$TOKEN_INVITE"
    echo "   📧 Email: $EMAIL"
    echo ""
    INVITED=$((INVITED + 1))
  else
    echo "   ❌ Erro ao enviar convite (HTTP $HTTP_CODE)"
    echo "   Response: $BODY"
    echo ""
    FAILED=$((FAILED + 1))
  fi
done

# ── Summary ──────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  📊 Resumo"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  ✅ Convites enviados: $INVITED"
echo "  ❌ Falhas: $FAILED"
echo ""

if [ "$INVITED" -gt 0 ]; then
  echo "═══════════════════════════════════════════════════════════"
  echo "  📧 Próximos passos:"
  echo ""
  echo "  1. Envie os links acima para cada tester"
  echo "  2. Ou configure SMTP para envio automático de emails"
  echo "  3. Compartilhe o guia: TESTING_GUIDE.md"
  echo "  4. Configure o Discord: docs/FEEDBACK_CHANNEL.md"
  echo ""
  echo "═══════════════════════════════════════════════════════════"
fi
