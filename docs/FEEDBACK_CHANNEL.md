# CloudBuilder — Canal de Feedback para Testers

## 📋 Visão Geral

Este guia configura canais de feedback para 3 testers validarem o MVP.

---

## 🎮 Discord (Recomendado)

### Estrutura do Servidor

```
CloudBuilder
├── 📢 ANÚNCIOS
│   └── #anúncios
├── 🧪 TESTE MVP
│   ├── #bate-papo          → Conversa geral
│   ├── #bugs               → Reportar bugs
│   ├── #sugestões          → Ideias e melhorias
│   ├── #dúvidas            → Perguntas sobre uso
│   └── #feedback-rápido    → Feedback瞬時 (1-5 estrelas)
├── 📚 RECURSOS
│   ├── #guia-de-teste      → Link para TESTING_GUIDE.md
│   ├── #changelog          → Atualizações do produto
│   └── #vídeo-tutorial     → Link para o vídeo
└── 🔧 SUPORTE
    └── #suporte-técnico    → Problemas técnicos
```

### Setup Rápido (5 min)

1. **Criar servidor:**
   - Discord → `+` → "Criar servidor"
   - Nome: `CloudBuilder MVP`
   - Upload do logo

2. **Criar canais:**
   ```
   /criar-canais bugs sugestões dúvidas feedback-rápido bate-papo
   ```

3. **Convidar testers:**
   - Configurações do servidor → Convites
   - Criar link permanente
   - Enviar para os 3 testers

4. **Configurar permissões:**
   - Testers: Ver canais, enviar mensagens, reagir
   - Você: Admin

---

## 📝 Template de Feedback

### Para bugs (`#bugs`)

```markdown
**🐛 BUG: [Título Curto]**

**Módulo:** Canvas / Provisioning / Auth / Outro
**Severidade:** 🔴 Alta | 🟡 Média | 🟢 Baixa

**Passos para reproduzir:**
1. 
2. 
3. 

**Comportamento esperado:**


**Comportamento atual:**


**Print/Screenshot:** (arraste aqui)

**Console (F12):** (se houver erros)
```

### Para sugestões (`#sugestões`)

```markdown
**💡 SUGESTÃO: [Título Curto]**

**Módulo:** Canvas / Provisioning / Auth / Geral

**O que você gostaria?**


**Por que seria útil?**


**Prioridade para você:** 🔴 Essencial | 🟡 Importante | 🟢 Legal ter
```

### Para dúvidas (`#dúvidas`)

```markdown
**❓ DÚVIDA: [Título Curto]**

**O que você tentou fazer?**


**O que aconteceu?**


**Já tentou:** (checklist)
- [ ] Reiniciar
- [ ] Limpar cache
- [ ] Consultar TESTING_GUIDE.md
```

### Para feedback rápido (`#feedback-rápido`)

```markdown
**Módulo:** [Canvas / Provisioning / Auth / Geral]
**Nota:** ⭐⭐⭐⭐⭐ (1-5)
**Comentário:** [Breve comentário]
```

---

## 🤖 Bot de Feedback (Opcional)

### Configurar Mee6 (5 min)

1. Acesse [mee6.xyz](https://mee6.xyz)
2. Adicione ao servidor Discord
3. Configure reaction roles para módulos:
   - 🎨 Canvas
   - 🚀 Provisioning
   - 💰 FinOps
   - 📊 Observability

### Configurar Webhook para GitHub (Opcional)

Se quiser que bugs vão direto para o GitHub:

1. GitHub → Settings → Webhooks → Add webhook
2. URL do webhook do Discord
3. Content type: `application/json`
4. Events: Issues, Pull requests

---

## 📊 Métricas de Feedback

### Dashboard Semanal

Crie um post fixado no `#bate-papo`:

```markdown
## 📊 Semana [X] — Resumo de Feedback

### Bugs Reportados
- 🔴 Alta: [X]
- 🟡 Média: [X]
- 🟢 Baixa: [X]

### Sugestões
- Essenciais: [X]
- Importantes: [X]
- Legais: [X]

### Nota Média
- Canvas: ⭐ [X]/5
- Provisioning: ⭐ [X]/5
- Auth: ⭐ [X]/5

### Ações Tomadas
- [ ] Bug #1 corrigido
- [ ] Sugestão #2 em andamento
- [ ] Dúvida #3 respondida
```

---

## 📧 Convite para Testers

### Mensagem de Convite

```markdown
Olá [Nome]!

Obrigado por testar o CloudBuilder MVP! 🚀

Acesse o canal de feedback no Discord:
👉 [Link do Discord]

Lá você pode:
- 🐛 Reportar bugs
- 💡 Sugerir melhorias
- ❓ Tirar dúvidas
- ⭐ Dar feedback rápido

Guia de teste: [Link para TESTING_GUIDE.md]
Login: admin@cloudbuilder.dev / Admin@123

Qualquer dúvida, é só perguntar no #dúvidas!
```

---

## 🔗 Webhook Integration

### Discord Webhook (5 min)

1. **Criar webhook:**
   - Server Settings → Integrations → Webhooks
   - New Webhook → Selecione o canal `#bugs`
   - Copie a URL

2. **Configurar no projeto:**
   ```bash
   # Adicionar ao .env
   export DISCORD_WEBHOOK_URL='https://discord.com/api/webhooks/...'
   ```

3. **Testar:**
   ```bash
   ./scripts/discord-webhook.sh bug "Teste" "Mensagem de teste" canvas medium
   ```

4. **Usar no feedback form:**
   - Abra `docs/feedback-form.html`
   - Cole a URL do webhook
   - Envie feedback → aparece no Discord!

### Slack Webhook (5 min)

1. **Criar webhook:**
   - Apps → Incoming Webhooks → Add New Webhook
   - Selecione o canal `#bugs`
   - Copie a URL

2. **Configurar no projeto:**
   ```bash
   # Adicionar ao .env
   export SLACK_WEBHOOK_URL='https://hooks.slack.com/services/...'
   ```

3. **Testar:**
   ```bash
   ./scripts/slack-webhook.sh bug "Teste" "Mensagem de teste" canvas medium
   ```

### Webhook URLs para cada canal

| Canal | Discord | Slack |
|-------|---------|-------|
| Bugs | `DISCORD_BUG_WEBHOOK_URL` | `SLACK_BUG_WEBHOOK_URL` |
| Feedback | `DISCORD_FEEDBACK_WEBHOOK_URL` | `SLACK_FEEDBACK_WEBHOOK_URL` |
| Geral | `DISCORD_WEBHOOK_URL` | `SLACK_WEBHOOK_URL` |

---

## ✅ Checklist de Setup

- [ ] Servidor Discord/Slack criado
- [ ] Canais configurados (bugs, sugestões, dúvidas, feedback-rápido)
- [ ] Webhooks criados para cada canal
- [ ] Variáveis de ambiente configuradas
- [ ] Template de feedback fixado em cada canal
- [ ] Convites enviados para 3 testers
- [ ] Guia de teste compartilhado
- [ ] Feedback form testado

---

## 🔄 Fluxo de Feedback

```
Tester reporta bug/sugestão
        ↓
Você vê no Discord
        ↓
Classifica severidade/prioridade
        ↓
Cria issue no GitHub (se necessário)
        ↓
Comunica status no Discord
        ↓
Corrige e faz deploy
        ↓
Notifica tester no Discord
```

---

## 📱 Notificações

### Configurar Push Notifications

- Discord mobile: Ativar notificações para `#bugs` e `#feedback-rápido`
- Discord desktop: Ativar para todos os canais de teste

### Resposta Esperada

- Bugs 🔴 Alta: Resposta em 24h
- Bugs 🟡 Média: Resposta em 48h
- Sugestões: Resposta em 1 semana
- Dúvidas: Resposta em 24h

---

## 🎯 Sucesso do MVP

### Métricas de Sucesso

| Métrica | Meta |
|---------|------|
| Testers ativos | 3/3 |
| Bugs reportados | ≥ 5 |
| Sugestões | ≥ 10 |
| Nota média | ≥ 4/5 |
| Features testadas | ≥ 80% |

### Sinais de Problema

| Sinal | Ação |
|-------|------|
| Poucos bugs reportados | Testers não estão testando? |
| Muitos bugs básicos | UX precisa melhorar |
| Nota < 3/5 | Priorizar correções urgentes |
| Testers desistem | Simplificar onboarding
