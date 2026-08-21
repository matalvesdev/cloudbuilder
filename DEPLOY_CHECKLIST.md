# 🚀 Deploy Checklist — CloudBuilder MVP

## ⏱️ Tempo estimado: 30 minutos

---

## Pré-requisitos

- [ ] Conta no [GitHub](https://github.com)
- [ ] Conta no [Vercel](https://vercel.com) (grátis)
- [ ] Conta no [Render](https://render.com) (grátis)
- [ ] Conta no [Neon](https://neon.tech) (grátis)
- [ ] Código no GitHub

---

## Passo 1: Banco de Dados (5 min)

- [ ] Criar conta no neon.tech
- [ ] Criar projeto "cloudbuilder"
- [ ] Copiar connection string
- [ ] Salvar senha em lugar seguro

**Connection string:**
```
postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/cloudbuilder?sslmode=require
```

---

## Passo 2: Backend (10 min)

- [ ] Criar conta no render.com
- [ ] New + → Web Service
- [ ] Conectar repositório GitHub
- [ ] Configurar:
  - [ ] Name: `cloudbuilder-api`
  - [ ] Runtime: Docker
  - [ ] Dockerfile: `backend/Dockerfile`
  - [ ] Instance: Free

- [ ] Adicionar variáveis:

```env
DATABASE_URL=<cole do Neon>
JWT_SECRET=$(openssl rand -base64 64)
CLOUDBUILDER_ENCRYPTION_KEY=$(openssl rand -base64 32)
SERVER_PORT=10000
SPRING_PROFILES_ACTIVE=prod
CORS_ALLOWED_ORIGINS=https://seu-app.vercel.app
JAVA_OPTS=-Xmx256m -Xms128m
```

- [ ] Create Web Service
- [ ] Aguardar build (2-5 min)
- [ ] Verificar health: `https://cloudbuilder-api.onrender.com/actuator/health`

---

## Passo 3: Frontend (5 min)

- [ ] Criar conta no vercel.com
- [ ] Add New → Project
- [ ] Importar repositório GitHub
- [ ] Configurar:
  - [ ] Framework: Vite
  - [ ] Root Directory: `frontend`
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `dist`

- [ ] Adicionar variável:

```env
VITE_API_URL=https://cloudbuilder-api.onrender.com/api/v1
```

- [ ] Deploy
- [ ] Aguardar build (1-2 min)
- [ ] Copiar URL: `https://seu-app.vercel.app`

---

## Passo 4: CORS (2 min)

- [ ] Voltar ao Render
- [ ] Edit Environment Variables
- [ ] Atualizar `CORS_ALLOWED_ORIGINS`:

```
CORS_ALLOWED_ORIGINS=https://seu-app.vercel.app
```

- [ ] Aguardar redeploy automático

---

## Passo 5: Verificar (5 min)

- [ ] Acessar frontend: `https://seu-app.vercel.app`
- [ ] Fazer login:
  - Email: `admin@cloudbuilder.dev`
  - Senha: `Admin@123`
- [ ] Verificar dashboard
- [ ] Abrir canvas de exemplo
- [ ] Gerar código Terraform

---

## Passo 6: Compartilhar com Testers (3 min)

- [ ] Copiar URL do frontend
- [ ] Enviar mensagem para testers:

```
Olá! 👋

CloudBuilder MVP está no ar! 🚀

🔗 Acesse: https://seu-app.vercel.app

Login: admin@cloudbuilder.dev
Senha: Admin@123

Guia de teste: https://seu-app.vercel.app/docs/TESTING_GUIDE.md
Formulário de feedback: https://seu-app.vercel.app/docs/feedback-local.html

⏱️ Tempo estimado: ~50 minutos

Obrigado! 🙏
```

- [ ] Receber feedbacks
- [ ] Analisar no dashboard: `feedback-dashboard.html`

---

## ✅ Deploy Completo!

### URLs finais

| Serviço | URL |
|---------|-----|
| **Frontend** | `https://seu-app.vercel.app` |
| **Backend** | `https://cloudbuilder-api.onrender.com` |
| **Health** | `https://cloudbuilder-api.onrender.com/actuator/health` |

### Custo: $0/mês

| Serviço | Free Tier |
|---------|-----------|
| Vercel | 100GB bandwidth |
| Render | 750h/mês |
| Neon | 0.5GB storage |

### ⚠️ Atenção

- Render spin down após 15min (30s delay no primeiro request)
- Seed data precisa ser inserido manualmente no Neon
- CORS precisa ser configurado após deploy do frontend
