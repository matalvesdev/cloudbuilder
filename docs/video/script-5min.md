# CloudBuilder — Script do Vídeo Tutorial (5 min)

## 📋 Pré-requisitos

- [ ] Conta criada no CloudBuilder
- [ ] Canvas de exemplo carregado
- [ ] Gravador de tela (OBS, Loom, ou similar)
- [ ] Resolução: 1920x1080 ou 1280x720

---

## 🎬 ESTRUTURA DO VÍDEO

### 0:00 — Introdução (30s)

**Tela:** Logo do CloudBuilder + título

**Narração:**
> "Olá! Neste vídeo vou mostrar como usar o CloudBuilder para criar infraestrutura cloud de forma visual. Em apenas 5 minutos, você vai ver como transformar um diagrama em código Terraform pronto para deploy."

**Ações na tela:**
- Mostrar logo animado
- Título: "CloudBuilder — Infraestrutura Visual em 5 Minutos"

---

### 0:30 — Login (30s)

**Tela:** Tela de login

**Narração:**
> "Primeiro, acesse o CloudBuilder e faça login com suas credenciais."

**Ações na tela:**
1. Abrir navegador
2. Digitar URL
3. Preencher email: `admin@cloudbuilder.dev`
4. Preencher senha: `Admin@123`
5. Clicar em "Entrar"
6. Dashboard carrega

**Texto na tela:**
```
Login: admin@cloudbuilder.dev
Senha: Admin@123
```

---

### 1:00 — Criar Canvas (1min 30s)

**Tela:** Canvas vazio

**Narração:**
> "Agora vamos criar um novo design de infraestrutura. No painel esquerdo, temos todos os recursos disponíveis para cada provedor cloud."

**Ações na tela:**
1. Clicar em "Novo Canvas"
2. Nomear: "Meu Primeiro Deploy"
3. **Arrastar VPC** do painel para o canvas
4. **Arrastar Subnet** e posicionar ao lado
5. **Conectar VPC → Subnet** (arrastar de uma borda para outra)
6. **Arrastar VM** e conectar à Subnet
7. **Arrastar SQL Database** e conectar à Subnet
8. **Zoom** para ver todos os recursos
9. **Clicar na VM** → editar propriedades:
   - Nome: "web-server"
   - Tipo: "e2-medium"
   - Zona: "us-central1-a"

**Texto na tela:**
```
1. Arraste recursos do painel
2. Conecte com as bordas
3. Configure clicando no nó
```

**Dica:** Mostrar atalhos:
- `Ctrl+Z` — Desfazer
- `Ctrl+S` — Salvar
- `Scroll` — Zoom

---

### 2:30 — Gerar Código Terraform (1min)

**Tela:** Canvas com recursos

**Narração:**
> "Com o design pronto, vamos gerar o código Terraform automaticamente."

**Ações na tela:**
1. Clicar em "Gerar Preview" ou "Preview Terraform"
2. Aguardar processamento
3. **Mostrar arquivos gerados:**
   - `main.tf`
   - `variables.tf`
   - `outputs.tf`
   - `providers.tf`
   - `versions.tf`
4. Clicar em "Ver main.tf"
5. **Expandir código** e mostrar:
   - Resources criados
   - Propriedades configuradas
   - Provider correto (Google Cloud)

**Texto na tela:**
```
✓ 5 arquivos Terraform gerados
✓ Resources com propriedades corretas
✓ Provider configurado automaticamente
```

---

### 3:30 — Provisionar (1min)

**Tela:** Painel de provisioning

**Narração:**
> "Agora vamos provisionar — ou seja, criar os recursos reais na nuvem."

**Ações na tela:**
1. Clicar em "Provisionar"
2. **Selecionar credencial** (ou mostrar como adicionar)
3. Escolher engine: "Terraform"
4. Marcar "Auto-apply" (para demo rápida)
5. Clicar em "Provisionar"
6. **Mostrar progresso:**
   - "Gerando código..."
   - "Enviando para Go Engine..."
   - "Executando terraform init..."
   - "Executando terraform plan..."
   - "Executando terraform apply..."
7. **Mostrar resultado:**
   - Status: "APPLIED"
   - Duração: "12.3s"
   - Resources: "4 added"

**Texto na tela:**
```
Status: ✅ APPLIED
Duração: 12.3s
Recursos: 4 criados
```

---

### 4:30 — Resultado e Próximos Passos (30s)

**Tela:** Dashboard ou tela de sucesso

**Narração:**
> "Pronto! Sua infraestrutura foi criada com sucesso. Você pode ver os recursos no provedor cloud, monitorar custos, e até detectar mudanças não autorizadas."

**Ações na tela:**
1. Mostrar tela de sucesso
2. Navegar rapidamente pelos módulos:
   - **FinOps** — ver custos estimados
   - **Observability** — ver métricas
3. Voltar ao dashboard

**Texto na tela:**
```
✅ Infraestrutura criada
📊 Custos monitorados
🔍 Métricas coletadas
```

---

### 5:00 — Encerramento (30s)

**Tela:** Logo + call to action

**Narração:**
> "CloudBuilder torna a infraestrutura cloud visual, acessível e segura. Comece agora gratuitamente em cloudbuilder.dev. Obrigado por assistir!"

**Ações na tela:**
1. Mostrar logo
2. URL: `cloudbuilder.dev`
3. Call to action: "Comece Grátis"
4. Links para documentação

**Texto na tela:**
```
CloudBuilder
cloudbuilder.dev

Comece Grátis Hoje!
```

---

## 🎨 VISUAIS SUGERIDOS

### Transições
- Fade entre seções
- Zoom suave nos elementos importantes
- Highlight amarelo nas ações do mouse

### Texto na Tela
- Fonte: Sans-serif (Inter, Roboto)
- Cor: Branco com sombra
- Posição: Canto inferior direito

### Música
- Lo-fi ou ambient (semopyright)
- Volume baixo (20-30%)

---

## 📝 CHECKLIST PÓS-GRAVAÇÃO

- [ ] Áudio claro e sem ruído
- [ ] Tela sem notificações
- [ ] Mouse visível e lento
- [ ] Texto na tela legível
- [ ] Duração total: ~5 minutos
- [ ] Exportar em 1080p ou 720p

---

## 🛠️ FERRAMENTAS SUGERIDAS

| Ferramenta | Uso | Preço |
|------------|-----|-------|
| **Loom** | Gravação rápida | Grátis |
| **OBS Studio** | Gravação avançada | Grátis |
| **DaVinci Resolve** | Edição | Grátis |
| **Canva** | Thumbnails | Grátis |
| **CapCut** | Edição mobile | Grátis |

---

## 📁 ESTRUTURA DO PROJETO

```
video/
├── script-5min.md      ← Este arquivo
├── thumbnails/         ← Thumbnails para YouTube
│   ├── thumb-1.png
│   └── thumb-2.png
├── assets/             ← Logos, ícones
│   ├── logo.png
│   └── icons/
└── output/             ← Vídeo final
    └── cloudbuilder-tutorial-5min.mp4
```
