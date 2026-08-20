# CloudBuilder — Deploy Gratuito (MVP)

## Arquitetura de Deploy (100% Free Tier)

```
┌─────────────────────────────────────────────────────┐
│                    USERS (Browser)                   │
└──────────────────────┬──────────────────────────────┘
                       │
              ┌────────▼────────┐
              │   Vercel (Free) │  ← Frontend React
              │   vercel.com    │
              └────────┬────────┘
                       │ HTTPS
              ┌────────▼────────┐
              │  Render (Free)  │  ← Backend Spring Boot
              │  render.com     │    + Go Engine (Docker)
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │  Neon (Free)    │  ← PostgreSQL Serverless
              │  neon.tech       │
              └─────────────────┘
```

## Serviços Gratuitos

| Serviço | Provider | Free Tier | URL |
|---------|----------|-----------|-----|
| **Frontend** | Vercel | 100GB bandwidth/mês | vercel.com |
| **Backend + Engine** | Render | 750h/mês, 512MB RAM | render.com |
| **Database** | Neon | 0.5GB storage, 24/7 compute | neon.tech |

## Por que Render?

- **750 horas grátis/mês** — suficiente para 24/7 (730h/mês)
- **512MB RAM** — suficiente para Spring Boot (~300MB uso)
- **SSL automático** — HTTPS gratuito
- **Health checks** — monitoramento básico incluído
- **Deploy do GitHub** — push para deploy
- **Docker support** — Go Engine roda como container

## Passo 1: Banco de Dados (Neon)

```bash
# 1. Criar conta em neon.tech (grátis)
# 2. Criar projeto "cloudbuilder"
# 3. Selecionar região (us-east-2 ou mais próxima)
# 4. Copiar connection string
# Formato: postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/cloudbuilder?sslmode=require
```

## Passo 2: Backend (Render)

```bash
# 1. Criar conta em render.com (grátis)
# 2. New → Web Service
# 3. Conectar repositório GitHub
# 4. Configurar:
#    - Name: cloudbuilder-api
#    - Runtime: Docker
#    - Dockerfile Path: backend/Dockerfile
#    - Instance Type: Free
# 5. Adicionar variáveis de ambiente (Environment Variables):

DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/cloudbuilder?sslmode=require
JWT_SECRET=$(openssl rand -base64 64)
CLOUDBUILDER_ENCRYPTION_KEY=$(openssl rand -base64 32)
SERVER_PORT=10000
SPRING_PROFILES_ACTIVE=prod
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
```

### Variáveis de Ambiente Obrigatórias

```env
# Database
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Security (gere com: openssl rand -base64 64)
JWT_SECRET=<64-byte-base64>
CLOUDBUILDER_ENCRYPTION_KEY=<32-byte-base64>

# Server (Render usa porta 10000 por padrão)
SERVER_PORT=10000
SPRING_PROFILES_ACTIVE=prod

# CORS (configure com seu domínio Vercel)
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
```

## Passo 3: Go Engine (Render)

```bash
# 1. No mesmo projeto Render, criar novo service
# 2. New → Docker
# 3. Configurar:
#    - Name: cloudbuilder-engine
#    - Dockerfile Path: provision-engine/Dockerfile
#    - Instance Type: Free
# 4. Adicionar variáveis:

PORT=50052
DATABASE_URL=<mesma do backend>
```

### Dockerfile do Go Engine

```dockerfile
# provision-engine/Dockerfile
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o engine ./cmd/api/main.go

FROM alpine:3.19
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /app/engine .
EXPOSE 50052
CMD ["./engine"]
```

## Passo 4: Frontend (Vercel)

```bash
# 1. Criar conta em vercel.com (grátis)
# 2. Import GitHub repo → pasta /frontend
# 3. Configurar:
#    - Framework: Vite
#    - Build Command: npm run build
#    - Output Directory: dist
# 4. Adicionar variáveis de ambiente:

VITE_API_URL=https://cloudbuilder-api.onrender.com/api/v1
VITE_PROVISION_ENGINE_URL=https://cloudbuilder-engine.onrender.com
```

## Passo 5: Configurar CORS no Backend

```bash
# No Render, adicionar variável:
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
```

## Passo 6: Configurar Dominio (Opcional)

```bash
# Vercel: Settings → Domains → Adicionar domínio customizado
# Render: Settings → Custom Domains → Adicionar domínio
```

## Limitações do Free Tier

| Serviço | Limitação | Impacto MVP |
|---------|-----------|-------------|
| **Render** | 750h/mês, 512MB RAM, spins down after 15min inactivity | Suficiente para 10-20 usuários |
| **Neon** | 0.5GB storage, 24/7 compute | Suficiente para MVP |
| **Vercel** | 100GB bandwidth/mês | Suficiente para 1000+ pageviews |

### ⚠️ Render Free Tier: Spin Down

O Render desliga instâncias após 15 minutos sem tráfego. Na primeira request após idle, leva ~30s para "acordar".

**Solução para MVP:**
- Usuário faz request → backend "acorda" em 30s → funciona normalmente
- Para produção: upgrade para Basic ($7/mês) → sem spin down

## Escala para Produção

Quando precisar escalar além do free tier:

| Serviço | Free → Paid | Custo Estimado |
|---------|-------------|----------------|
| **Render** | Free → Basic | $7/mês (512MB, sem spin down) |
| **Neon** | Free → Launch | $19/mês (10GB) |
| **Vercel** | Free → Pro | $20/mês (1TB) |
| **Total** | — | **~$46/mês** para 100+ usuários |

## Comandos Úteis

```bash
# Ver logs Render
# Dashboard → cloudbuilder-api → Logs

# Verificar saúde
curl https://cloudbuilder-api.onrender.com/actuator/health

# Métricas Prometheus
curl https://cloudbuilder-api.onrender.com/actuator/prometheus
```

## Variáveis de Ambiente Completas

```env
# === DATABASE ===
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# === SECURITY ===
JWT_SECRET=<generate with: openssl rand -base64 64>
CLOUDBUILDER_ENCRYPTION_KEY=<generate with: openssl rand -base64 32>

# === SERVER ===
SERVER_PORT=10000
SPRING_PROFILES_ACTIVE=prod

# === CORS ===
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app

# === RATE LIMITING ===
RATE_LIMIT_RPM=100
RATE_LIMIT_AUTH_RPM=10

# === OPTIONAL ===
KAFKA_ENABLED=false
SSO_ENABLED=false
OPA_URL=
```

## Troubleshooting

### Backend não inicia
```
Erro: Application failed to start
Causa: Falta JWT_SECRET ou DATABASE_URL
Solução: Verificar todas as variáveis de ambiente obrigatórias
```

### CORS error no frontend
```
Erro: Access to XMLHttpRequest blocked by CORS policy
Causa: CORS_ALLOWED_ORIGINS não inclui o domínio do Vercel
Solução: Adicionar https://your-app.vercel.app em CORS_ALLOWED_ORIGINS
```

### Go Engine timeout
```
Erro: Timeout ao conectar com Go Engine
Causa: Engine não está rodando ou URL incorreta
Solução: Verificar VITE_PROVISION_ENGINE_URL no frontend
```

### Render spin down (30s delay)
```
Causa: Render desliga instâncias após 15min sem tráfego
Solução Normal: Aceitar o delay (MVP)
Solução Produção: Upgrade para Basic ($7/mês)
```
