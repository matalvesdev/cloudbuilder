# CloudBuilder Discord — Bots Setup Guide

## 🤖 Mee6 (Moderação + Engagement)

### O que é
Mee6 é o bot de moderação mais popular do Discord. Oferece:
- Auto-moderação (spam, links, palavras proibidas)
- Sistema de níveis (gamificação)
- Welcome messages
- Custom commands
- Music (opcional)

### Passo 1: Adicionar ao Servidor

1. Acesse https://mee6.xyz
2. Clique em **Add to Discord**
3. Faça login com sua conta Discord
4. Selecione o servidor **CloudBuilder**
5. Autorize as permissões

### Passo 2: Configurar Auto-Mod

1. No dashboard do Mee6, vá em **Moderation**
2. Ative as seguintes opções:

#### Anti-Spam
- ✅ **Anti-Spam**: Ativado
- ✅ **Mensagem máxima por minuto**: 5
- ✅ **Ação**: Mute por 5 minutos

#### Anti-Links
- ✅ **Bloquear links**: Ativado
- ✅ **Exceções**: Permitir links de Discord e GitHub
- ✅ **Ação**: Deletar mensagem + warn

#### Anti-Invite
- ✅ **Bloquear convites do Discord**: Ativado
- ✅ **Ação**: Deletar mensagem

#### Palavras Proibidas
- ✅ **Lista de palavras**: Adicione palavras inadequadas
- ✅ **Ação**: Deletar mensagem + warn

### Passo 3: Configurar Welcome Message

1. Vá em **Welcome Goodbye**
2. Ative **Welcome message**
3. Configure:

```
Bem-vindo ao CloudBuilder Discord, {user}! 👋

Aqui você encontra:
💬 Discussões sobre Platform Engineering
🛠️ Suporte técnico
💰 Dicas de FinOps
🤝 Networking

Comece se apresentando em <#apresentações>!
```

4. Selecione o canal: **#bem-vindos**

### Passo 4: Configurar Níveis (Opcional)

1. Vá em **Leveling**
2. Ative o sistema de níveis
3. Configure recompensas por nível:

| Nível | Recompensa |
|-------|------------|
| 5 | Badge "Membro Ativo" |
| 10 | Acesso a canais exclusivos |
| 20 | Badge "Contribuidor" |
| 50 | Badge "Expert" |

### Passo 5: Custom Commands

1. Vá em **Custom Commands**
2. Crie os seguintes comandos:

#### !help
```
Comandos disponíveis:
!help - Mostra esta ajuda
!docs [query] - Busca na documentação
!blog - Mostra posts recentes
!newsletter - Link para inscrição
!status - Status do CloudBuilder
!invite - Link de convite do servidor
```

#### !docs
```
📖 Documentação do CloudBuilder:
https://cloudbuilder.io/docs

Precisa de ajuda? Pergunte em #ajuda
```

#### !blog
```
📝 Blog do CloudBuilder:
https://cloudbuilder.io/blog

Novos artigos toda semana sobre Platform Engineering e FinOps!
```

#### !newsletter
```
📧 Inscreva-se na newsletter:
https://cloudbuilder.io/newsletter

Receba dicas semanais no seu email!
```

#### !status
```
🟢 CloudBuilder está operacional!

Status: https://status.cloudbuilder.io
Dúvidas? Fale em #ajuda
```

#### !invite
```
🔗 Convide amigos para o servidor:
https://discord.gg/cloudbuilder
```

---

## 🐱 Carl-bot (Moderação Avançada + Reaction Roles)

### O que é
Carl-bot complementa o Mee6 com:
- Reaction roles avançados
- Logging detalhado
- Custom embeds
- Automod avançado

### Passo 1: Adicionar ao Servidor

1. Acesse https://carl.gg
2. Clique em **Add to Server**
3. Selecione o servidor **CloudBuilder**
4. Autorize as permissões

### Passo 2: Configurar Reaction Roles

1. No dashboard, vá em **Reaction Roles**
2. Clique em **Create Reaction Role**

#### Configuração 1: Interesses
- **Canal**: #reaction-roles
- **Mensagem**: (já criada pelo setup anterior)
- **Modo**: Keep existing role (não remove se já tem)
- **Roles**:
  - 🛠️ → Platform Engineering
  - 💰 → FinOps
  - ☁️ → Multi-Cloud
  - 🔒 → Security
  - 📊 → Observability
  - 🤖 → AIOps

#### Configuração 2: Notificações (Opcional)
- **Canal**: #reaction-roles
- **Mensagem**: "Reaja para receber notificações:"
- **Roles**:
  - 📢 → Notificações
  - 📅 → Eventos

### Passo 3: Configurar Logging

1. Vá em **Dashboard → Logging**
2. Configure:

#### Message Logs
- ✅ **Canal**: #moderação
- ✅ **Eventos**: Delete, Edit, Bulk Delete
- ✅ **Ignorar**: Bots

#### Member Logs
- ✅ **Canal**: #moderação
- ✅ **Eventos**: Join, Leave, Ban, Kick, Mute

#### Server Logs
- ✅ **Canal**: #moderação
- ✅ **Eventos**: Channel create/delete, Role create/delete

### Passo 4: Configurar Automod

1. Vá em **Automod**
2. Configure regras adicionais:

#### Caps Lock
- ✅ **Ativado**: Sim
- ✅ **Limite**: 70% maiúsculas
- ✅ **Ação**: Deletar mensagem

#### Repeated Characters
- ✅ **Ativado**: Sim
- ✅ **Limite**: 5 caracteres repetidos
- ✅ **Ação**: Deletar mensagem

#### Mention Spam
- ✅ **Ativado**: Sim
- ✅ **Limite**: 5 menções
- ✅ **Ação**: Mute por 10 minutos

### Passo 5: Custom Embeds (Opcional)

1. Vá em **Embeds**
2. Crie embeds para:

#### Welcome Embed
```json
{
  "title": "Bem-vindo ao CloudBuilder! 🚀",
  "description": "A comunidade de Platform Engineering e FinOps do Brasil.",
  "color": "#CCFF00",
  "fields": [
    {
      "name": "📋 Comece por aqui",
      "value": "1. Apresente-se em <#apresentações>\n2. Escolha seus interesses em <#reaction-roles>\n3. Participe das discussões!"
    },
    {
      "name": "🔗 Links úteis",
      "value": "[Blog](https://cloudbuilder.io/blog) | [Docs](https://cloudbuilder.io/docs) | [GitHub](https://github.com/cloudbuilder)"
    }
  ],
  "footer": {
    "text": "CloudBuilder Community"
  }
}
```

#### Event Embed
```json
{
  "title": "📅 Evento: Office Hours CloudBuilder",
  "description": "Q&A aberto sobre Platform Engineering e FinOps.",
  "color": "#0A1128",
  "fields": [
    {
      "name": "🕐 Quando",
      "value": "Quarta-feira, 14h (Horário de Brasília)"
    },
    {
      "name": "📍 Onde",
      "value": "Canal de voz #office-hours"
    },
    {
      "name": "🎯 Temas",
      "value": "• Custos cloud\n• Terraform tips\n• Multi-cloud strategy"
    }
  ],
  "footer": {
    "text": "Participe e tire suas dúvidas!"
  }
}
```

---

## 📊 Configuração Recomendada

### Permissões dos Bots

| Bot | Permissões Necessárias |
|-----|------------------------|
| Mee6 | Manage Messages, Kick Members, Ban Members, Manage Roles, Send Messages |
| Carl-bot | Manage Messages, Manage Roles, Send Messages, Embed Links, Attach Files |

### Hierarquia de Roles

```
@Staff (yoursel)
@Moderador
├── Mee6 (bot)
├── Carl-bot (bot)
@Beta Tester
@Contribuidor
@Membro
```

**Importante**: Os bots devem estar abaixo do @Staff na hierarquia para poderem moderar.

---

## 🧪 Testar Configuração

### Teste Mee6
1. Envie spam (5+ msgs rápidas) → Deve ser mutado
2. Envie link externo → Deve ser deletado
3. Entre no servidor → Deve receber welcome message

### Teste Carl-bot
1. Clique em reaction role → Deve receber role
2. Delete uma mensagem → Deve ser logado em #moderação
3. Use comando !help → Deve funcionar

---

## 🔧 Troubleshooting

### Bot não responde
1. Verifique se o bot está online (ponto verde)
2. Verifique se tem permissão no canal
3. Verifique se o comando está correto

### Reaction role não funciona
1. Verifique se a mensagem existe
2. Verifique se as reações estão corretas
3. Recrie a reaction role no dashboard

### Logging não aparece
1. Verifique se o canal #moderação existe
2. Verifique se o bot tem permissão de leitura
3. Verifique as configurações de logging no dashboard
