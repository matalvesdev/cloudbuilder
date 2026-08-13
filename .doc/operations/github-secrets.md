# CloudBuilder — GitHub Secrets Guide

## 🔐 Secrets Necessários

### Para GitHub Pages (Frontend)

**Nenhum secret adicional necessário!** O workflow usa o `GITHUB_TOKEN` automático.

### Para Railway (Backend)

| Secret | Descrição | Como obter |
|--------|-----------|------------|
| `RAILWAY_TOKEN` | Token de deploy do Railway | Railway Dashboard → Settings → Tokens |

### Para Plunk (Email)

| Secret | Descrição | Como obter |
|--------|-----------|------------|
| `PLUNK_API_KEY` | Chave API do Plunk | useplunk.com → Settings → API Keys |

### Para OAuth (SSO)

| Secret | Descrição | Como obter |
|--------|-----------|------------|
| `GITHUB_CLIENT_ID` | GitHub OAuth App ID | GitHub → Settings → Developer settings → OAuth Apps |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Secret | Mesmo local acima |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | console.cloud.google.com → Credentials |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | Mesmo local acima |

### Para AI (Opcional)

| Secret | Descrição | Como obter |
|--------|-----------|------------|
| `OPENAI_API_KEY` | Chave API OpenAI | platform.openai.com → API Keys |
| `ANTHROPIC_API_KEY` | Chave API Anthropic | console.anthropic.com → API Keys |

---

## 📋 Como Adicionar Secrets

1. Vá ao repositório no GitHub
2. Clique em **Settings**
3. No menu lateral, vá em **Secrets and variables → Actions**
4. Clique em **New repository secret**
5. Adicione cada secret com nome e valor

---

## 🔧 Configuração do Railway

### Passo 1: Criar conta
1. Acesse https://railway.app
2. Faça login com GitHub

### Passo 2: Criar projeto
1. Clique em **New Project**
2. Selecione **Deploy from GitHub repo**
3. Selecione o repositório `cloudbuilder`

### Passo 3: Configurar build
1. No serviço do backend, vá em **Settings**
2. Configure:
   - **Build Command**: `cd backend && mvn package -DskipTests`
   - **Start Command**: `cd backend && java -jar target/*.jar`
   - **Port**: 8080

### Passo 4: Adicionar PostgreSQL
1. No dashboard, clique em **+ New**
2. Selecione **Database → PostgreSQL**
3. Railway cria as variáveis automaticamente

### Passo 5: Adicionar variáveis de ambiente
No dashboard do Railway, vá em **Variables** e adicione:

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

### Passo 6: Obter token
1. Vá em **Account Settings → Tokens**
2. Clique em **Create Token**
3. Copie o token
4. Adicione como `RAILWAY_TOKEN` no GitHub

---

## 🧪 Testar Deploy

### Frontend (GitHub Pages)
```bash
# Push para main ativa deploy
git push origin main

# Verificar status
gh run list --workflow=deploy-pages.yml
```

### Backend (Railway)
```bash
# Push para main ativa deploy automaticamente
# Verificar no dashboard do Railway
```

---

## 🔍 Verificar Secrets

Para verificar se os secrets estão configurados:

```bash
# Listar workflows
gh workflow list

# Verificar último run
gh run list --limit=5

# Verificar logs
gh run view <run-id>
```

---

## ⚠️ Segurança

- **NUNCA** commite secrets no código
- **NUNCA** exponha secrets em logs
- Use secrets do GitHub para CI/CD
- Use variáveis de ambiente para rodar local
- Rotate secrets periodicamente
