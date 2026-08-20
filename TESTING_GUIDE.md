# CloudBuilder — Guia de Teste (MVP)

## 🔐 Login

| Campo | Valor |
|-------|-------|
| **Email** | `admin@cloudbuilder.dev` |
| **Senha** | `Admin@123` |

**URL:** `https://seu-app.vercel.app` (ou `http://localhost:3000` se local)

---

## ✅ Checklist de Teste

### 1. Autenticação (5 min)

- [ ] Acessar a URL e ver a tela de login
- [ ] Fazer login com as credenciais acima
- [ ] Verificar que redireciona para o dashboard
- [ ] Fazer logout
- [ ] Testar login com email/senha errados (deve mostrar erro)

---

### 2. Canvas — Criar Infraestrutura (10 min)

- [ ] Clicar em **"Novo Canvas"** ou **"Criar Design"**
- [ ] Arrastar um recurso **VPC** (Google Cloud) para o canvas
- [ ] Arrastar um recurso **Subnet** e conectar ao VPC
- [ ] Arrastar um recurso **VM** e conectar à Subnet
- [ ] Arrastar um recurso **SQL Database** e conectar à Subnet
- [ ] Clicar em um nó e editar as propriedades (nome, região, etc.)
- [ ] Usar o **zoom** (scroll do mouse) e **pan** (arrastar fundo)
- [ ] Usar o **minimap** para navegar
- [ ] Salvar o canvas (Ctrl+S ou botão salvar)

**Recursos para testar:**

| Provedor | Recursos |
|----------|----------|
| **Google Cloud** | VPC, Subnet, VM, SQL |
| **AWS** | VPC, Subnet, EC2, RDS |
| **Azure** | VNet, Subnet, VM, SQL |

---

### 3. Canvas de Exemplo (5 min)

- [ ] Verificar se os canvas de exemplo aparecem na lista:
  - **"GCP Stack - Exemplo"** (VPC → Subnet → VM → SQL)
  - **"AWS Stack - Exemplo"** (VPC → Subnet → EC2)
- [ ] Abrir um canvas de exemplo
- [ ] Verificar que os nós e conexões estão corretos
- [ ] Editar uma propriedade e salvar

---

### 4. Geração de Código Terraform (10 min)

- [ ] Abrir um canvas com recursos
- [ ] Clicar em **"Gerar Preview"** ou **"Preview Terraform"**
- [ ] Verificar que os arquivos são gerados:
  - `main.tf`
  - `variables.tf`
  - `outputs.tf`
  - `providers.tf`
  - `versions.tf`
- [ ] Clicar em **"Ver main.tf"** para expandir
- [ ] Verificar que o código Terraform está correto para o provedor

**Exemplo esperado (GCP):**
```hcl
resource "google_compute_network" "vpc" {
  name                    = "main-vpc"
  auto_create_subnetworks = false
}
```

---

### 5. Provisionamento (15 min)

**⚠️ Requer credenciais reais do cloud provider**

- [ ] Clicar em **"Provisionar"** no painel do canvas
- [ ] Selecionar uma credencial (ou adicionar nova)
- [ ] Escolher engine: **Terraform** ou **OpenTofu**
- [ ] Marcar **"Auto-apply"** para aplicar sem revisão
- [ ] Clicar em **"Provisionar"**
- [ ] Verificar o status:
  - `PLANNED` = Plano gerado, aguardando aprovação
  - `APPLIED` = Recursos criados com sucesso
  - `FAILED` = Erro (verificar mensagem)

---

### 6. Navegação e Módulos (10 min)

- [ ] Navegar entre os módulos no menu lateral:
  - **Canvas** — Design visual
  - **Provisioning** — Deploy
  - **FinOps** — Custos
  - **Observability** — Métricas
  - **IAM** — Usuários e permissões
  - **Settings** — Configurações

- [ ] Verificar que cada módulo carrega sem erros
- [ ] Testar atalhos de teclado:
  - `Ctrl+Z` — Desfazer
  - `Ctrl+Y` — Refazer
  - `Ctrl+C` — Copiar nó
  - `Ctrl+V` — Colar nó
  - `Delete` — Remover nó selecionado

---

### 7. Comportamento Responsivo (5 min)

- [ ] Redimensionar a janela do navegador
- [ ] Verificar que o layout se adapta
- [ ] Testar em tela cheia
- [ ] Verificar que o canvas funciona em telas menores

---

### 8. Erros e Edge Cases (5 min)

- [ ] Tentar salvar canvas vazio (deve funcionar)
- [ ] Tentar provisionar sem credencial (deve mostrar erro)
- [ ] Tentar acessar URL direta sem login (deve redirecionar)
- [ ] Recarregar a página (F5) — dados devem persistir
- [ ] Abrir em nova aba — dados devem sincronizar

---

## 🐛 Como Reportar Bugs

Ao encontrar um bug, reporte com:

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

## 🆘 Suporte

- **Dúvidas:** Pergunte no grupo de teste
- **Bugs:** Abra issue no GitHub ou envie mensagem
- **Urgências:** Entre em contato diretamente

---

## ⏱️ Tempo Estimado

| Tarefa | Tempo |
|--------|-------|
| Login + navegação | 5 min |
| Criar canvas | 10 min |
| Gerar código | 10 min |
| Provisionar | 15 min |
| Explorar módulos | 10 min |
| **Total** | **~50 min** |

---

## ✅ Ao Finalizar

Marque as tarefas concluídas e envie o formulário de feedback.

Obrigado por testar o CloudBuilder! 🚀
