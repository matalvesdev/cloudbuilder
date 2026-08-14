# CloudBuilder Discord — Guia Completo de Setup

## 📋 Visão Geral

**Estado Atual do Servidor**: Apenas canal #geral + Geral (voz) + bot BOTRAVEL (de outro projeto)

**Objetivo**: Transformar no servidor completo com 22+ canais, 3 bots, roles e moderação automática.

**Tempo estimado**: 45-60 minutos

---

## 🔧 Pré-requisitos

| Item | Onde Pegar | Status |
|------|-----------|--------|
| Conta Discord | https://discord.com | ✅ |
| Permissão Admin | No servidor | ✅ |
| Mee6 | https://mee6.xyz | ⬜ |
| Carl-bot | https://carl.gg | ⬜ |
| Bot Token (CloudBot) | https://discord.com/developers | ⬜ |

---

## 📝 Passo 1: Criar CloudBot no Developer Portal

> O BOTRAVEL que está no servidor é de outro projeto. Precisamos criar nosso próprio bot.

### 1.1 Criar Aplicação

1. Acesse https://discord.com/developers/applications
2. Clique em **New Application**
3. Nome: **CloudBot**
4. Avatar: Use o logo do CloudBuilder (512x512px)

### 1.2 Configurar Bot

1. Vá em **Bot** no menu lateral
2. Clique em **Reset Token** → Copie o token
3. Ative **Privileged Gateway Intents**:
   - ✅ Server Members Intent
   - ✅ Message Content Intent

### 1.3 Gerar Link de Convite

1. Vá em **OAuth2 → URL Generator**
2. **Scopes**: ✅ bot
3. **Bot Permissions**:
   - ✅ Manage Channels
   - ✅ Manage Roles
   - ✅ Send Messages
   - ✅ Embed Links
   - ✅ Attach Files
   - ✅ Read Message History
   - ✅ Use Slash Commands
4. Copie a **Generated URL**

### 1.4 Autorizar no Servidor

1. Abra a URL copiada no navegador
2. Selecione o servidor **CloudBuilder**
3. Clique em **Authorize**

### 1.5 Salvar o Token

```
DISCORD_BOT_TOKEN=<cole_o_token_aqui>
```

> ⚠️ **Nunca compartilhe o token publicamente!**

---

## 📁 Passo 2: Criar Categorias

Clique com botão direito na sidebar → **Create Category**

| # | Categoria | Ordem |
|---|-----------|-------|
| 1 | 📢 ANÚNCIOS | Topo |
| 2 | 💬 GERAL | |
| 3 | 🛠️ TÉCNICO | |
| 4 | 🎯 PLATAFORMA | |
| 5 | 💰 FINOPS | |
| 6 | 📚 RECURSOS | |
| 7 | 🔒 ADMIN | Final |

**Dica**: Arraste as categorias para ordenar.

---

## 📢 Passo 3: Criar Canais

Clique no **+** ao lado de cada categoria:

### 📢 ANÚNCIOS

| Canal | Tipo | Descrição |
|-------|------|-----------|
| #anúncios | Texto | Novidades oficiais |
| #changelog | Texto | Atualizações do produto |
| #eventos | Texto | Eventos e lives |

**Permissões**: Somente staff envia, membros leem.

### 💬 GERAL

| Canal | Tipo | Descrição |
|-------|------|-----------|
| #geral | Texto | Já existe ✅ |
| #apresentações | Texto | Novos membros se apresentam |
| #off-topic | Texto | Conversas livres |

### 🛠️ TÉCNICO

| Canal | Tipo | Descrição |
|-------|------|-----------|
| #ajuda | Texto | Dúvidas técnicas |
| #dicas | Texto | Dicas e truques |
| #terraform | Texto | IaC discussões |
| #kubernetes | Texto | Orquestração |
| #aws | Texto | Amazon Web Services |
| #azure | Texto | Microsoft Azure |
| #gcp | Texto | Google Cloud |

### 🎯 PLATAFORMA

| Canal | Tipo | Descrição |
|-------|------|-----------|
| #cloudbuilder | Texto | Discussão sobre o produto |
| #bugs | Texto | Reportar bugs |
| #features | Texto | Sugerir features |

### 💰 FINOPS

| Canal | Tipo | Descrição |
|-------|------|-----------|
| #finops | Texto | Gestão de custos |
| #cost-optimization | Texto | Otimização de gastos |

### 📚 RECURSOS

| Canal | Tipo | Descrição |
|-------|------|-----------|
| #blog | Texto | Novos artigos |
| #newsletter | Texto | Inscrição na newsletter |
| #docs | Texto | Documentação |
| #github | Texto | Repositórios e PRs |

### 🔒 ADMIN

| Canal | Tipo | Descrição |
|-------|------|-----------|
| #staff | Texto | Conversa da equipe |
| #moderação | Texto | Logs e moderação |
| #reaction-roles | Texto | Auto-atribuição de roles |
| #bem-vindos | Texto | Mensagens de boas-vindas |

---

## 🎭 Passo 4: Criar Roles

Vá em **Server Settings → Roles → Create Role**

### Roles Principais

| Role | Cor Hex | Cor | Permissões |
|------|---------|-----|------------|
| @Staff | #CCFF00 | 🟡 Lime | Administrador |
| @Moderador | #0A1128 | 🔵 Navy | Gerenciar mensagens, kick, ban |
| @Beta Tester | #E3E2FD | 🔵 Ice Blue | Leitura |
| @Contribuidor | #00FF00 | 🟢 Verde | Leitura |
| @Membro | #808080 | ⚪ Cinza | Leitura |

### Roles de Interesse (para Reaction Roles)

| Role | Cor | Descrição |
|------|-----|-----------|
| Platform Engineering | #FF6B35 | 🟠 Laranja |
| FinOps | #00D26A | 🟢 Verde |
| Multi-Cloud | #0099FF | 🔵 Azul |
| Security | #FF4757 | 🔴 Vermelho |
| Observability | #A855F7 | 🟣 Roxo |
| AIOps | #FFD93D | 🟡 Amarelo |

### Hierarquia de Roles

```
@Staff (topo)
@Moderador
├── Mee6 (bot)
├── Carl-bot (bot)
├── CloudBot (bot)
@Beta Tester
@Contribuidor
@Membro
Platform Engineering
FinOps
Multi-Cloud
Security
Observability
AIOps
```

**Importante**: Os bots devem estar **abaixo** do @Staff e **acima** das roles de interesse na hierarquia.

---

## 🤖 Passo 5: Instalar e Configurar Mee6

### 5.1 Instalar

1. Acesse https://mee6.xyz
2. Clique em **Add to Discord**
3. Faça login com sua conta Discord
4. Selecione o servidor **CloudBuilder**
5. Clique em **Authorize**

### 5.2 Configurar Anti-Spam

Vá em **Moderation → Auto-Mod**

| Configuração | Valor |
|--------------|-------|
| Anti-Spam | ✅ Ativado |
| Mensagens máximas/min | 5 |
| Ação | Mute 5 minutos |
| Mensagem de aviso | "Pare de spam! 🛑" |

### 5.3 Configurar Anti-Links

| Configuração | Valor |
|--------------|-------|
| Bloquear links | ✅ Ativado |
| Exceções | discord.gg, github.com, cloudbuilder.dev |
| Ação | Deletar mensagem |

### 5.4 Configurar Welcome Message

Vá em **Welcome Goodbye**

| Configuração | Valor |
|--------------|-------|
| Enable | ✅ Ativado |
| Canal | #bem-vindos |

**Mensagem de Boas-Vindas**:
```
Bem-vindo ao CloudBuilder Discord, {user}! 👋

Aqui você encontra:
💬 Discussões sobre Platform Engineering
🛠️ Suporte técnico
💰 Dicas de FinOps
🤝 Networking

Comece se apresentando em <#apresentações>!
Escolha seus interesses em <#reaction-roles>!
```

### 5.5 Criar Custom Commands

Vá em **Custom Commands → Add Command**

| Comando | Resposta |
|---------|----------|
| `!help` | 📋 **Comandos CloudBuilder**\n\n!help - Esta mensagem\n!docs - Documentação\n!blog - Blog oficial\n!newsletter - Inscreva-se\n!invite - Link de convite\n!status - Status do sistema |
| `!blog` | 📝 **Blog CloudBuilder**\n\nLeia nossos artigos: https://cloudbuilder.dev/blog |
| `!newsletter` | 📧 **Newsletter**\n\nInscreva-se para receber conteúdo: https://cloudbuilder.dev/newsletter |
| `!invite` | 🔗 **Convide Amigos**\n\nLink: https://discord.gg/cloudbuilder |
| `!status` | 🟢 **CloudBuilder está operacional!**\n\nTodos os sistemas funcionando. |
| `!docs` | 📖 **Documentação**\n\nAcesse: https://cloudbuilder.dev/docs |

---

## 🐱 Passo 6: Instalar e Configurar Carl-bot

### 6.1 Instalar

1. Acesse https://carl.gg
2. Clique em **Add to Server**
3. Faça login com sua conta Discord
4. Selecione o servidor **CloudBuilder**
5. Clique em **Authorize**

### 6.2 Configurar Reaction Roles

1. Vá em **Reaction Roles**
2. Clique em **Create Reaction Role**

| Campo | Valor |
|-------|-------|
| Canal | #reaction-roles |
| Modo | Keep existing role |

3. Adicione as roles com emojis:

| Emoji | Role |
|-------|------|
| 🛠️ | Platform Engineering |
| 💰 | FinOps |
| ☁️ | Multi-Cloud |
| 🔒 | Security |
| 📊 | Observability |
| 🤖 | AIOps |

4. Clique em **Save**

### 6.3 Configurar Logging

Vá em **Dashboard → Logging**

| Campo | Valor |
|-------|-------|
| Canal | #moderação |
| Message Logs | ✅ Delete, ✅ Edit, ✅ Bulk Delete |
| Member Logs | ✅ Join, ✅ Leave, ✅ Ban, ✅ Kick |
| Server Logs | ✅ Channel Create/Delete, ✅ Role Create/Delete |

Clique em **Save**.

### 6.4 Configurar Auto-Role (Opcional)

Vá em **Autorole**

| Campo | Valor |
|-------|-------|
| Enable | ✅ Ativado |
| Role | @Membro |

Todo novo membro recebe automaticamente a role @Membro.

---

## ☁️ Passo 7: Configurar CloudBot (Bot Próprio)

### 7.1 Rodar o Bot

```bash
cd geos/content/discord
set DISCORD_BOT_TOKEN=<seu_token>
python setup-bot.py --server-id=1537526878120837132
```

### 7.2 Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `!help` | Lista de comandos |
| `!docs` | Busca na documentação |
| `!blog` | Posts recentes do blog |
| `!newsletter` | Link de inscrição |
| `!status` | Status do CloudBuilder |
| `!invite` | Link de convite |

### 7.3 Manter Rodando (Produção)

Para o bot ficar online 24/7, deploy em:

| Serviço | Custo | Link |
|---------|-------|------|
| Railway | $0 (free tier) | https://railway.app |
| Render | $0 (free tier) | https://render.com |
| Fly.io | $0 (free tier) | https://fly.io |

---

## 🔗 Passo 8: Configurar Webhooks

### 8.1 GitHub → Discord

1. Vá no canal #github
2. Clique em **Edit Channel → Integrations → Webhooks**
3. Clique em **New Webhook**
4. Nome: **GitHub Bot**
5. Avatar: Logo do GitHub
6. Copie a **Webhook URL**

### 8.2 Configurar no GitHub

1. Vá ao repositório no GitHub
2. **Settings → Webhooks → Add webhook**
3. **Payload URL**: Cole a URL do webhook
4. **Content type**: application/json
5. **Events**: Select individual events
   - ✅ Push
   - ✅ Pull requests
   - ✅ Issues
   - ✅ Release
6. Clique em **Add webhook**

### 8.3 Configurar Blog → Discord

1. Vá no canal #blog
2. Crie um webhook similar
3. Use no CMS/build pipeline para notificar novos posts

---

## 🧪 Passo 9: Testar Tudo

### Testar Mee6

| # | Teste | Ação | Resultado Esperado |
|---|-------|------|-------------------|
| 1 | Anti-Spam | Enviar 6+ msgs rápidas em #geral | Mute automático |
| 2 | Anti-Links | Enviar `https://google.com` em #geral | Mensagem deletada |
| 3 | Welcome | Entrar com outra conta | Mensagem em #bem-vindos |
| 4 | Comandos | Enviar `!help` | Lista de comandos |
| 5 | Comandos | Enviar `!blog` | Link do blog |

### Testar Carl-bot

| # | Teste | Ação | Resultado Esperado |
|---|-------|------|-------------------|
| 1 | Reaction Roles | Clicar em 🛠️ em #reaction-roles | Receber role "Platform Engineering" |
| 2 | Reaction Roles | Clicar em 💰 | Receber role "FinOps" |
| 3 | Logging | Deletar mensagem em #geral | Log em #moderação |
| 4 | Logging | Editar mensagem | Log em #moderação |
| 5 | Auto-Role | Entrar com nova conta | Receber @Membro |

### Testar CloudBot

| # | Teste | Ação | Resultado Esperado |
|---|-------|------|-------------------|
| 1 | Comando | `!help` em #geral | Lista de comandos |
| 2 | Comando | `!blog` em #geral | Link do blog |
| 3 | Comando | `!invite` em #geral | Link de convite |
| 4 | Comando | `!status` em #geral | Status operacional |
| 5 | Comando | `!newsletter` em #geral | Link de inscrição |

### Testar Webhooks

| # | Teste | Ação | Resultado Esperado |
|---|-------|------|-------------------|
| 1 | GitHub | Push para o repositório | Mensagem em #github |
| 2 | GitHub | Abrir PR | Mensagem em #github |

---

## ✅ Checklist Final

### Infraestrutura
- [ ] Servidor CloudBuilder criado
- [ ] Logo uploadada (512x512px)
- [ ] 7 categorias criadas
- [ ] 22+ canais criados
- [ ] 11 roles criadas (5 principais + 6 interesse)

### Bots
- [ ] CloudBot criado no Developer Portal
- [ ] CloudBot autorizado no servidor
- [ ] Mee6 instalado
- [ ] Mee6: Anti-Spam configurado
- [ ] Mee6: Anti-Links configurado
- [ ] Mee6: Welcome Message configurado
- [ ] Mee6: Custom Commands criados
- [ ] Carl-bot instalado
- [ ] Carl-bot: Reaction Roles configurado
- [ ] Carl-bot: Logging configurado
- [ ] Carl-bot: Auto-Role configurado

### Webhooks
- [ ] GitHub webhook configurado em #github
- [ ] Blog webhook configurado em #blog

### Testes
- [ ] Mee6: Anti-spam funcionando
- [ ] Mee6: Anti-links funcionando
- [ ] Mee6: Welcome message funcionando
- [ ] Mee6: Comandos funcionando
- [ ] Carl-bot: Reaction roles funcionando
- [ ] Carl-bot: Logging funcionando
- [ ] CloudBot: Comandos funcionando
- [ ] Webhooks: GitHub → Discord funcionando

---

## 🔗 Links Úteis

| Recurso | Link |
|---------|------|
| Discord Developer Portal | https://discord.com/developers/applications |
| Mee6 Dashboard | https://mee6.xyz/dashboard |
| Carl-bot Dashboard | https://carl.gg/dashboard |
| CloudBuilder GitHub | https://github.com/cloudbuilder/cloudbuilder |

---

## ❓ Troubleshooting

### Bot não aparece online
1. Verifique se o bot foi autorizado no servidor
2. Verifique se tem permissão "Send Messages"
3. Reinicie o Discord
4. Verifique se o token está correto

### Reaction Roles não funciona
1. Verifique se o Carl-bot tem permissão "Manage Roles"
2. Verifique se as roles estão **abaixo** do bot na hierarquia
3. Recrie a reaction role
4. Verifique se o canal #reaction-roles existe

### Logging não aparece
1. Verifique se o canal #moderação existe
2. Verifique se o bot tem permissão "Read Messages" e "Send Messages"
3. Verifique as configurações de logging no dashboard do Carl-bot
4. Aguarde 1-2 minutos (propagação)

### Comandos Mee6 não funcionam
1. Verifique se o Mee6 está online (ponto verde)
2. Verifique se os comandos estão configurados no dashboard
3. Aguarde alguns minutos (propagação)
4. Verifique se não há conflito com outros bots

### CloudBot não responde
1. Verifique se o bot está rodando (`setup-bot.py`)
2. Verifique se o token está correto
3. Verifique se tem permissão "Read Message History"
4. Verifique se `Message Content Intent` está ativo

### BOTRAVEL conflita
1. O BOTRAVEL é de outro projeto
2. Pode ser removido se não for necessário
3. Ou ignorado se não causar conflitos

---

## 📞 Suporte

Se precisar de ajuda:
- **Discord**: https://discord.gg/cloudbuilder
- **Email**: suporte@cloudbuilder.dev
- **GitHub**: https://github.com/cloudbuilder/cloudbuilder/issues
