# CloudBuilder — Deploy Gratuito (MVP)

## Arquitetura

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
              │  render.com     │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │  Neon (Free)    │  ← PostgreSQL Serverless
              │  neon.tech       │
              └─────────────────┘
```

## Pré-requisitos

- [ ] Conta no [GitHub](https://github.com)
- [ ] Conta no [Vercel](https://vercel.com) (grátis)
- [ ] Conta no [Render](https://render.com) (grátis)
- [ ] Conta no [Neon](https://neon.tech) (grátis)

---

## Passo 1: Banco de Dados (Neon)

1. Acesse [neon.tech](https://neon.tech) e crie uma conta
2. Crie um novo projeto:
   - **Project name:** `cloudbuilder`
   - **Region:** `us-east-2` (ou mais próxima)
3. Copie a connection string:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/cloudbuilder?sslmode=require
   ```
4. **Importante:** Copie a senha em um lugar seguro

---

## Passo 2: Backend (Render)

1. Acesse [render.com](https://render.com) e crie uma conta
2. Clique em **New +** → **Web Service**
3. Conecte seu repositório GitHub
4. Configure:
   - **Name:** `cloudbuilder-api`
   - **Runtime:** Docker
   - **Dockerfile Path:** `backend/Dockerfile`
   - **Instance Type:** Free

5. Adicione variáveis de ambiente (Environment Variables):

   ```env
   # Database (cole do Neon)
   DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/cloudbuilder?sslmode=require

   # Security (gere com: openssl rand -base64 64)
   JWT_SECRET=<cole-64-bytes-base64>
   CLOUDBUILDER_ENCRYPTION_KEY=<cole-32-bytes-base64>

   # Server
   SERVER_PORT=10000
   SPRING_PROFILES_ACTIVE=prod

   # CORS (configure com o domínio do Vercel após deploy)
   CORS_ALLOWED_ORIGINS=https://seu-app.vercel.app

   # JVM (Render free tier: 512MB RAM)
   JAVA_OPTS=-Xmx256m -Xms128m
   ```

6. Clique em **Create Web Service**
7. Aguarde o build (2-5 minutos)

### Gerar secrets

```bash
# JWT Secret
openssl rand -base64 64

# Encryption Key
openssl rand -base64 32
```

---

## Passo 3: Frontend (Vercel)

1. Acesse [vercel.com](https://vercel.com) e crie uma conta
2. Clique em **Add New...** → **Project**
3. Importe o repositório GitHub
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

5. Adicione variáveis de ambiente:

   ```env
   VITE_API_URL=https://cloudbuilder-api.onrender.com/api/v1
   ```

6. Clique **Deploy**
7. Aguarde o build (1-2 minutos)

---

## Passo 4: Configurar CORS

Após o deploy do frontend, atualize o CORS no Render:

1. Vá ao painel do Render → `cloudbuilder-api`
2. Edit **Environment Variables**
3. Atualize `CORS_ALLOWED_ORIGINS`:
   ```
   CORS_ALLOWED_ORIGINS=https://seu-app.vercel.app
   ```
4. O Render fará redeploy automaticamente

---

## Passo 5: Verificar

1. Acesse o frontend: `https://seu-app.vercel.app`
2. Verifique o backend: `https://cloudbuilder-api.onrender.com/actuator/health`
3. Faça login:
   - **Email:** `admin@cloudbuilder.dev`
   - **Senha:** `Admin@123`

---

## Custo Total: $0/mês

| Serviço | Free Tier | Limitação |
|---------|-----------|-----------|
| **Vercel** | 100GB bandwidth/mês | Suficiente para 1000+ pageviews |
| **Render** | 750h/mês, 512MB RAM | Spin down após 15min (30s delay) |
| **Neon** | 0.5GB storage, 24/7 compute | Suficiente para MVP |

### ⚠️ Render Spin Down

O Render desliga instâncias após 15 minutos sem tráfego. Na primeira request:
- **Delay:** ~30 segundos para "acordar"
- **Solução MVP:** Aceitar o delay
- **Solução produção:** Upgrade para Basic ($7/mês)

---

## Troubleshooting

### Backend não inicia
```
Verifique:
1. DATABASE_URL está correto?
2. JWT_SECRET e CLOUDBUILDER_ENCRYPTION_KEY estão definidos?
3. Logs no Render → cloudbuilder-api → Logs
```

### CORS error no frontend
```
Erro: Access to XMLHttpRequest blocked by CORS policy
Solução: CORS_ALLOWED_ORIGINS deve incluir o domínio do Vercel
```

### Login falha
```
Verifique:
1. Backend está rodando? (health check)
2. URL do backend está correta no frontend?
3. Senha: Admin@123
```

### Canvas não carrega
```
Verifique:
1. Backend retornou dados?
2. Tenant ID está correto?
3. Console do navegador (F12)
```

---

## Deploy Local (Alternativa)

Para testar localmente sem deploy:

```bash
cd CloudBuilder

# 1. Copiar .env
cp .env.example .env

# 2. Editar .env com secrets
# JWT_SECRET=$(openssl rand -base64 64)
# CLOUDBUILDER_ENCRYPTION_KEY=$(openssl rand -base64 32)

# 3. Subir com Docker
docker compose up -d

# 4. Acessar
# Frontend: http://localhost:3000
# Backend: http://localhost:8080
# Login: admin@cloudbuilder.dev / Admin@123
```

---

## Variáveis de Ambiente Completas

### Backend (Render)

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | ✅ | Connection string do Neon |
| `JWT_SECRET` | ✅ | 64 bytes base64 |
| `CLOUDBUILDER_ENCRYPTION_KEY` | ✅ | 32 bytes base64 |
| `SERVER_PORT` | ✅ | `10000` (Render padrão) |
| `SPRING_PROFILES_ACTIVE` | ✅ | `prod` |
| `CORS_ALLOWED_ORIGINS` | ✅ | Domínio do Vercel |
| `JAVA_OPTS` | Opcional | `-Xmx256m -Xms128m` |

### Frontend (Vercel)

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `VITE_API_URL` | ✅ | URL do backend + `/api/v1` |

---

## Próximos Passos

1. **Dominio customizado** — Configure um domínio no Vercel
2. **Monitoring** — Adicione alertas no Render
3. **Backup** — Neon tem Point-in-Time Recovery
4. **CI/CD** — GitHub Actions para deploy automático
