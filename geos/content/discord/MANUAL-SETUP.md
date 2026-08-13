# CloudBuilder Discord — Setup Manual

Guia passo a passo para criar o servidor Discord do CloudBuilder.

## 🚀 Criar o Servidor

1. Abra o Discord
2. Clique no **+** ao lado de "Servidores"
3. Selecione **"Criar meu próprio servidor"**
4. Nome: **CloudBuilder**
5. Upload do logo: `geos/content/discord/logo.png` (ou use o ícone padrão)

## 📋 Criar Categorias e Canais

### 📢 ANÚNCIOS
| Canal | Tipo | Permissões |
|-------|------|------------|
| `#anúncios` | Texto | Somente staff envia |
| `#changelog` | Texto | Somente staff envia |
| `#eventos` | Texto | Todos enviam |

### 💬 GERAL
| Canal | Tipo | Permissões |
|-------|------|------------|
| `#geral` | Texto | Todos |
| `#apresentações` | Texto | Todos |
| `#off-topic` | Texto | Todos |

### 🛠️ TÉCNICO
| Canal | Tipo | Permissões |
|-------|------|------------|
| `#ajuda` | Texto | Todos |
| `#dicas` | Texto | Todos |
| `#code-review` | Texto | Todos |
| `#terraform` | Texto | Todos |
| `#kubernetes` | Texto | Todos |
| `#aws` | Texto | Todos |
| `#azure` | Texto | Todos |
| `#gcp` | Texto | Todos |

### 🎯 PLATAFORMA
| Canal | Tipo | Permissões |
|-------|------|------------|
| `#cloudbuilder` | Texto | Todos |
| `#bugs` | Texto | Todos |
| `#features` | Texto | Todos |
| `#integrations` | Texto | Todos |

### 💰 FINOPS
| Canal | Tipo | Permissões |
|-------|------|------------|
| `#finops` | Texto | Todos |
| `#cost-optimization` | Texto | Todos |
| `#budget` | Texto | Todos |

### 📚 RECURSOS
| Canal | Tipo | Permissões |
|-------|------|------------|
| `#blog` | Texto | Todos |
| `#newsletter` | Texto | Todos |
| `#docs` | Texto | Todos |
| `#github` | Texto | Todos |

### 🔒 ADMIN
| Canal | Tipo | Permissões |
|-------|------|------------|
| `#staff` | Texto | Somente staff |
| `#moderação` | Texto | Somente staff |

## 🎭 Criar Roles

| Role | Cor | Permissões |
|------|-----|------------|
| `@Staff` | 🟡 #CCFF00 | Administrador |
| `@Moderador` | 🔵 #0A1128 | Moderação |
| `@Beta Tester` | 🔵 #E3E2FD | Leitura |
| `@Contribuidor` | 🟢 #00FF00 | Leitura |
| `@Membro` | ⚪ #808080 | Leitura |

### Como criar roles:
1. Clique no nome do servidor → **Configurações do Servidor**
2. Vá em **Roles**
3. Clique **Create Role**
4. Configure nome, cor e permissões
5. Arraste na ordem (Staff no topo)

## 👋 Configurar Welcome

1. Crie o canal `#bem-vindos` na categoria **ANÚNCIOS**
2. Envie esta mensagem:

```
Bem-vindo ao CloudBuilder Discord! 👋

Aqui você encontra:
💬 Discussões sobre Platform Engineering
🛠️ Suporte técnico
💰 Dicas de FinOps
🤝 Networking

Comece se apresentando em <#apresentações>!
```

## 🎭 Configurar Reaction Roles

1. Crie o canal `#reaction-roles` na categoria **GERAL**
2. Envie esta mensagem:

```
Escolha seus interesses reagindo abaixo! 🎯

🛠️ — Platform Engineering
💰 — FinOps
☁️ — Multi-Cloud
🔒 — Security
📊 — Observability
🤖 — AIOps
```

3. Adicione as reações na mensagem

## 🤖 Configurar Bots

### Mee6 (Moderação)
1. Acesse https://mee6.xyz
2. Adicione ao servidor
3. Configure:
   - Auto-moderação: spam, links
   - Welcome message
   - Level system

### Carl-bot (Moderação avançada)
1. Acesse https://carl.gg
2. Adicione ao servidor
3. Configure:
   - Reaction roles
   - Logging
   - Custom embeds

### GitHub Bot
1. Acesse https://github.com/apps/github
2. Instale no repositório
3. Configure webhook no Discord

## 🔗 Criar Link de Convite

1. Clique no nome do servidor → **Configurações do Servidor**
2. Vá em **Invites**
3. Clique **Create Invite**
4. Configure:
   - Expira em: **Nunca**
   - Limite de usos: **Sem limite**
5. Copie o link

Link final: `https://discord.gg/cloudbuilder`

## 📊 Configurar Analytics

1. Adicione o Statbot: https://statbot.net
2. Configure tracking de:
   - Mensagens por canal
   - Membros ativos
   - Crescimento

## ✅ Checklist Final

- [ ] Servidor criado com nome "CloudBuilder"
- [ ] Logo uploaded
- [ ] 7 categorias criadas
- [ ] 22+ canais criados
- [ ] 5 roles criadas
- [ ] Welcome message configurada
- [ ] Reaction roles configuradas
- [ ] Bots instalados (Mee6, Carl-bot)
- [ ] Link de convite criado
- [ ] Analytics configurado

## 📈 Próximos Passos

1. **Compartilhar link**: Adicione ao site, newsletter, social media
2. **Convidar staff**: Adicione membros do time como @Staff
3. **Publicar primeiro post**: Anuncie o lançamento da comunidade
4. **Agendar eventos**: Office Hours, Tech Talks
5. **Monitorar métricas**: Acompanhe crescimento semanal
