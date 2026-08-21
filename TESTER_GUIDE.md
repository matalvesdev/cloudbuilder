# CloudBuilder — Guia do Tester

## 🎯 O que é o CloudBuilder?

CloudBuilder é uma **plataforma de engenharia de plataforma** que permite:
- **Projetar** infraestrutura em nuvem com um canvas visual (arrastar e soltar)
- **Gerar código** Terraform automaticamente
- **Provisionar** recursos reais na nuvem (GCP, AWS, Azure)
- **Observar** a infraestrutura provisionada

---

## 🚀 Como Começar

### Opção 1: Cadastro via Convite (Recomendado)

Se você recebeu um **email de convite**:

1. **Clique no link** do email "Aceitar Convite"
2. Preencha o formulário:
   - **Nome completo:** Seu nome
   - **Email:** O mesmo email do convite
   - **Senha:** Mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo
   - **Confirmar senha:** Repita a senha
3. Marque **"Aceitar Termos de Uso"**
4. Clique em **"Aceitar convite e criar conta"**
5. Pronto! Você será redirecionado para o dashboard

### Opção 2: Cadastro Direto

Se não recebeu convite:

1. Acesse a URL do sistema
2. Na tela de login, clique em **"Criar conta"**
3. Preencha:
   - **Nome completo:** Seu nome
   - **Email:** Seu email
   - **Senha:** Mínimo 8 caracteres
   - **Organização:** Nome da empresa/time (opcional)
   - **Patente:** Escolha sua role:
     - **Arquiteto/CTO** → Acesso total (Admin)
     - **DevOps/SRE** → Leitura + escrita (Editor)
     - **Developer** → Somente leitura (Viewer)
4. Marque **"Aceitar Termos"**
5. Clique em **"Criar conta"**

### Opção 3: Usuário Demo (Já criado)

Use as credenciais de demonstração:

| Campo | Valor |
|-------|-------|
| **Email** | `admin@cloudbuilder.dev` |
| **Senha** | `Admin@123` |

---

## 📋 Checklist de Teste (50 min)

### 1. Login e Navegação (5 min)

- [ ] Acessar a URL e ver a tela de login
- [ ] Fazer login com suas credenciais
- [ ] Verificar que o dashboard carrega
- [ ] Explorar o menu lateral (módulos)
- [ ] Fazer logout e login novamente

**Módulos disponíveis:**
| Módulo | Ícone | Descrição |
|--------|-------|-----------|
| Dashboard | 📊 | Visão geral |
| Design | 🎨 | Canvas visual |
| Provisionar | 🚀 | Deploy na nuvem |
| Observar | 👁️ | Métricas e logs |
| Custos | 💰 | FinOps |
| AIOps | 🤖 | Inteligência artificial |
| IAM | 🔐 | Usuários e permissões |
| Configurações | ⚙️ | Settings |

---

### 2. Criar Canvas — Design Visual (10 min)

- [ ] Clicar em **"Design"** no menu
- [ ] Clicar em **"Novo Canvas"** ou **"+"**
- [ ] Dar um nome ao canvas (ex: "Meu Teste")
- [ ] **Arrastar recursos** da sidebar para o canvas:
  - Google Cloud: VPC, Subnet, VM, SQL
  - AWS: VPC, Subnet, EC2, RDS
  - Azure: VNet, Subnet, VM, SQL

- [ ] **Conectar recursos** com edges (arrastar de um nó para outro)
- [ ] **Editar propriedades** clicando em um nó:
  - Nome do recurso
  - Região/Zona
  - Tipo de máquina
  - Outras configurações

- [ ] **Zoom** com scroll do mouse
- [ ] **Pan** (mover canvas) arrastando o fundo
- [ ] **Minimap** para navegar em canvases grandes
- [ ] **Salvar** com Ctrl+S ou botão salvar
- [ ] **Undo/Redo** com Ctrl+Z / Ctrl+Y

**Dica:** Use `Delete` para remover nós selecionados.

---

### 3. Canvas de Exemplo (5 min)

- [ ] Verificar se os canvas de exemplo aparecem na lista:
  - **"GCP Stack - Exemplo"** → VPC → Subnet → VM → SQL
  - **"AWS Stack - Exemplo"** → VPC → Subnet → EC2

- [ ] Abrir um canvas de exemplo
- [ ] Verificar que os nós e conexões estão corretos
- [ ] Editar uma propriedade e salvar
- [ ] Verificar que as mudanças persistem ao recarregar

---

### 4. Gerar Código Terraform (10 min)

- [ ] Abrir um canvas com recursos
- [ ] Clicar em **"Gerar Preview"** ou **"Preview Terraform"**
- [ ] Verificar que os arquivos são gerados:
  - `main.tf` — Recursos principais
  - `variables.tf` — Variáveis de entrada
  - `outputs.tf` — Saídas
  - `providers.tf` — Configuração do provedor
  - `versions.tf` — Versões do Terraform

- [ ] **Expandir** cada arquivo para ver o código
- [ ] Verificar que o código está correto para o provedor

**Exemplo esperado (GCP):**
```hcl
resource "google_compute_network" "vpc" {
  name                    = "main-vpc"
  auto_create_subnetworks = false
}
```

**Exemplo esperado (AWS):**
```hcl
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}
```

---

### 5. Provisionamento (15 min)

**⚠️ Requer credenciais reais do cloud provider**

- [ ] Clicar em **"Provisionar"** no painel do canvas
- [ ] **Adicionar credencial** (se ainda não tiver):
  - Nome: "Minha Conta GCP"
  - Tipo: Google Cloud / AWS / Azure
  - Chave: Cole a chave de serviço

- [ ] Selecionar a credencial
- [ ] Escolher engine: **Terraform** ou **OpenTofu**
- [ ] Marcar **"Auto-apply"** para aplicar sem revisão
- [ ] Clicar em **"Provisionar"**
- [ ] Acompanhar o progresso:
  - `PLANNED` → Plano gerado, aguardando aprovação
  - `APPLIED` → Recursos criados com sucesso ✅
  - `FAILED` → Erro (verificar mensagem) ❌

**Se não tiver credenciais:** Teste apenas a geração de código (Passo 4).

---

### 6. Navegar entre Módulos (10 min)

- [ ] **Dashboard** — Ver métricas gerais
- [ ] **Observability** — Ver logs e métricas
- [ ] **FinOps** — Ver custos simulados
- [ ] **IAM** — Ver usuários e permissões
- [ ] **Settings** — Ver configurações

- [ ] Verificar que cada módulo carrega sem erros
- [ ] Testar atalhos de teclado:
  - `Ctrl+K` — Busca global
  - `Ctrl+Z` — Desfazer
  - `Ctrl+Y` — Refazer

---

### 7. Responsividade (5 min)

- [ ] Redimensionar a janela do navegador
- [ ] Verificar que o layout se adapta
- [ ] Testar em tela cheia
- [ ] Verificar que o canvas funciona em telas menores

---

### 8. Edge Cases (5 min)

- [ ] Tentar salvar canvas vazio (deve funcionar)
- [ ] Tentar provisionar sem credencial (deve mostrar erro)
- [ ] Tentar acessar URL direta sem login (deve redirecionar)
- [ ] Recarregar a página (F5) — dados devem persistir
- [ ] Abrir em nova aba — dados devem sincronizar

---

## 🐛 Como Reportar Bugs

Ao encontrar um bug, reporte com este formato:

```
**Título:** [Módulo] Descrição curta do bug

**Passos para reproduzir:**
1. Acessar...
2. Clicar em...
3. Preencher...

**Comportamento esperado:**
O que deveria acontecer

**Comportamento atual:**
O que realmente aconteceu

**Screenshots:** (se possível)

**Console (F12):** (se houver erros)

**Navegador:** Chrome / Firefox / Safari
**Sistema:** Windows / Mac / Linux
```

---

## 📊 Formulário de Feedback

Após os testes, responda:

| Pergunta | Nota (1-5) |
|----------|------------|
| Facilidade de uso | ⭐⭐⭐⭐⭐ |
| Performance | ⭐⭐⭐⭐⭐ |
| Visual/design | ⭐⭐⭐⭐⭐ |
| Funcionalidade | ⭐⭐⭐⭐⭐ |
| Confiabilidade | ⭐⭐⭐⭐⭐ |

**O que mais gostou:**


**O que precisa melhorar:**


**Sugestões:**


---

## ⏱️ Tempo Estimado

| Tarefa | Tempo |
|--------|-------|
| Login/Cadastro | 5 min |
| Criar canvas | 10 min |
| Canvas de exemplo | 5 min |
| Gerar código | 10 min |
| Provisionar | 15 min |
| Explorar módulos | 10 min |
| Responsivo + Edge | 10 min |
| **Total** | **~65 min** |

---

## 🆘 Suporte

- **Dúvidas:** Pergunte no grupo de teste
- **Bugs:** Abra issue ou envie mensagem
- **Urgências:** Entre em contato diretamente

---

## ✅ Ao Finalizar

1. Marque as tarefas concluídas
2. Preencha o formulário de feedback
3. Envie seus relatórios de bug
4. Obrigado por testar o CloudBuilder! 🚀
