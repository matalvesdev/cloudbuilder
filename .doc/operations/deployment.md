# CloudBuilder — Guia de Deploy

## Deploy do Frontend (Vercel)

### Pré-requisitos

1. Conta no [Vercel](https://vercel.com) (free tier disponível)
2. Repositório no GitHub
3. Domínio `cloudbuilder.dev` registrado

### Passo 1: Configurar Vercel

1. Acesse https://vercel.com/new
2. Importe o repositório `cloudbuilder/cloudbuilder`
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Adicione as variáveis de ambiente:
   ```
   VITE_API_URL=https://api.cloudbuilder.dev/api/v1
   VITE_PLUNK_API_KEY=pk_...
   ```

### Passo 2: Configurar Domínio

1. No dashboard do Vercel, vá em **Settings → Domains**
2. Adicione `cloudbuilder.dev`
3. Configure os DNS:
   ```
   Tipo    Nome    Valor
   A       @       76.76.21.21
   CNAME   www     cname.vercel-dns.com
   ```

### Passo 3: Configurar GitHub Secrets

Adicione ao repositório GitHub (Settings → Secrets → Actions):

| Secret | Valor |
|--------|-------|
| `VERCEL_ORG_ID` | Obtido do Vercel CLI |
| `VERCEL_PROJECT_ID` | Obtido do Vercel CLI |
| `VERCEL_TOKEN` | Token de acesso do Vercel |

Para obter os IDs:
```bash
cd frontend
npx vercel link
cat .vercel/project.json
```

### Passo 4: Deploy Automático

O workflow `.github/workflows/deploy-frontend.yml` faz deploy automático:
- **Push para `main`**: Deploy em produção
- **Pull Request**: Deploy de preview

### Deploy Manual

```bash
cd frontend
npx vercel --prod
```

## Deploy do Backend (Railway)

### Pré-requisitos

1. Conta no [Railway](https://railway.app)
2. PostgreSQL no Railway

### Passo 1: Criar Projeto

1. Acesse https://railway.app/new
2. Selecione "Deploy from GitHub Repo"
3. Selecione o repositório

### Passo 2: Configurar Serviços

1. **Backend**:
   - Build: `cd backend && mvn package -DskipTests`
   - Start: `java -jar backend/target/*.jar`
   - Port: 8080

2. **PostgreSQL**:
   - Adicione um plugin PostgreSQL

### Passo 3: Variáveis de Ambiente

```
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=${{PGHOST}}:${{PGPORT}}/${{PGDATABASE}}
SPRING_DATASOURCE_USERNAME=${{PGUSER}}
SPRING_DATASOURCE_PASSWORD=${{PGPASSWORD}}
JWT_SECRET=seu-secret-aqui
CLOUDBUILDER_ENCRYPTION_KEY=seu-key-aqui
```

## Deploy Full Stack (Docker)

```bash
# Build e rodar tudo
docker compose up --build -d

# Verificar status
docker compose ps

# Logs
docker compose logs -f backend
```

## Variáveis de Ambiente de Produção

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | ✅ | URL do PostgreSQL |
| `JWT_SECRET` | ✅ | Secret para JWT (base64, 64 bytes) |
| `CLOUDBUILDER_ENCRYPTION_KEY` | ✅ | Key para AES-256 (base64, 64 bytes) |
| `VITE_API_URL` | ✅ | URL da API backend |
| `VITE_PLUNK_API_KEY` | ❌ | API key do Plunk |
| `GITHUB_CLIENT_ID` | ❌ | OAuth GitHub |
| `GITHUB_CLIENT_SECRET` | ❌ | OAuth GitHub |

## SSL/TLS

O Vercel configura SSL automaticamente. Para Docker:
```bash
# Usar Let's Encrypt com Certbot
certbot certonly --webroot -w /var/www/html -d cloudbuilder.dev
```

## Monitoramento

- **Vercel**: Analytics + Speed Insights nativos
- **Railway**: Metrics + Logs nativos
- **Backend**: `/actuator/health` + `/actuator/metrics`
