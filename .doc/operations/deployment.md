# CloudBuilder — Guia de Deploy (100% Gratuito)

## Estratégia de Infraestrutura Gratuita

| Componente | Serviço | Custo |
|------------|---------|-------|
| Frontend | GitHub Pages | $0 |
| Backend | Railway (free tier) | $0 (500h/mês) |
| Database | Supabase (free tier) | $0 (500MB) |
| Email | Plunk (free tier) | $0 (100 emails/dia) |
| DNS | Cloudflare (free tier) | $0 |
| CDN | Cloudflare (free tier) | $0 |
| Analytics | Umami (self-hosted) | $0 |
| Monitoring | UptimeRobot (free) | $0 (50 monitores) |

**Total: $0/mês para MVP**

---

## Deploy do Frontend (GitHub Pages)

### Pré-requisitos

1. Repositório no GitHub
2. Habilitar GitHub Pages no repositório

### Passo 1: Habilitar GitHub Pages

1. Vá em **Settings → Pages** no repositório
2. Em **Source**, selecione **GitHub Actions**
3. O deploy será automático a cada push no `main`

### Passo 2: Configurar Domínio (Opcional)

Para usar `cloudbuilder.dev`:

1. Compre o domínio (Namecheap, Cloudflare, etc.)
2. Configure DNS:
   ```
   Tipo    Nome    Valor
   CNAME   www     <user>.github.io
   A       @       185.199.108.153
   A       @       185.199.109.153
   A       @       185.199.110.153
   A       @       185.199.111.153
   ```
3. Adicione arquivo `CNAME` na pasta `public/`:
   ```
   cloudbuilder.dev
   ```

### Deploy Automático

O workflow `.github/workflows/deploy-pages.yml` faz deploy automático:
- **Push para `main`**: Build + Deploy
- **Manual**: Via Actions → Run workflow

### URL de Acesso

- **GitHub Pages**: `https://<user>.github.io/cloudbuilder/`
- **Domínio próprio**: `https://cloudbuilder.dev/`

## Deploy do Backend (Railway Free Tier)

### Pré-requisitos

1. Conta no [Railway](https://railway.app) (free tier: 500h/mês)
2. GitHub连接

### Passo 1: Criar Projeto

1. Acesse https://railway.app/new
2. Selecione "Deploy from GitHub Repo"
3. Selecione o repositório
4. Selecione a pasta `backend`

### Passo 2: Configurar Build

Railway detecta automaticamente o Java. Se necessário, configure:

- **Build Command**: `mvn package -DskipTests`
- **Start Command**: `java -jar target/*.jar`
- **Port**: 8080

### Passo 3: Adicionar PostgreSQL

1. No dashboard do Railway, clique em "+ New"
2. Selecione "Database" → "PostgreSQL"
3. Railway cria automaticamente as variáveis `PGHOST`, `PGPORT`, etc.

### Passo 4: Variáveis de Ambiente

Adicione no dashboard:

```
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=${PGHOST}:${PGPORT}/${PGDATABASE}
SPRING_DATASOURCE_USERNAME=${PGUSER}
SPRING_DATASOURCE_PASSWORD=${PGPASSWORD}
SPRING_JPA_HIBERNATE_DDL_AUTO=validate
SPRING_FLYWAY_ENABLED=true
JWT_SECRET=<gere-com-openssl-rand-base64-64>
CLOUDBUILDER_ENCRYPTION_KEY=<gere-com-node-crypto>
```

### Passo 5: Gerar Secrets

```bash
# JWT Secret
openssl rand -base64 64

# Encryption Key
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### Limitações do Free Tier

- 500h de execução por mês
- 512MB de RAM
- 1GB de disco
- Sleep após 5 min de inatividade (cold start ~30s)

### Dica: Manter Ativo

Para evitar sleep, use o UptimeRobot para fazer ping a cada 5 minutos:
```
https://<seu-app>.railway.app/actuator/health
```

## Deploy Full Stack (Docker — Local/Dev)

Para desenvolvimento local ou self-hosting:

```bash
# Build e rodar tudo
docker compose up --build -d

# Verificar status
docker compose ps

# Logs
docker compose logs -f backend
```

### Custo Docker Self-Hosted

Se hospedar em um VPS (Hetzner, Contabo):
- Hetzner CX22: ~€4.50/mês (2 vCPU, 4GB RAM)
- Contabo V S: ~€5/mês (4 vCPU, 8GB RAM)

**Recomendação para MVP**: Use Railway free tier. Migre para VPS quando atingir 100+ usuários.

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
