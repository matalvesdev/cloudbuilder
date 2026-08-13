# CloudBuilder — Visão Geral do Produto

## O que é o CloudBuilder

O CloudBuilder é uma plataforma de **Platform Engineering** que permite a empresas projetar, provisionar e monitorar infraestrutura cloud de forma visual e integrada.

## Principais Features

### 🎨 Design Visual
- Canvas drag-and-drop para projetar infraestrutura
- Suporte a AWS, Azure, GCP e Kubernetes
- Validação automática de configs (CIDR overlap, connection compatibility)
- Geração automática de código Terraform

### ⚙️ Provisioning Automático
- Geração de Terraform (main.tf, variables.tf, outputs.tf, providers.tf)
- Deploy pipeline com aprovação
- Ambientes efêmeros para testes
- Drift detection automático

### 📊 Observabilidade
- Dashboard de saúde dos serviços
- Service Map visual
- Scorecards de maturidade
- Alertas com ciclo de vida

### 💰 FinOps
- Dashboard de custos com breakdown por provider
- Anomaly detection (7-day moving average)
- What-if analysis (3-tier: min/avg/max)
- Budget alerts (80%/100%)

### 🤖 AIOps
- Assistente IA para diagnóstico de incidentes
- Auto-remediation suggestions
- Classificação automática de incidentes

### 🔐 Segurança
- JWT + RBAC (admin, editor, viewer)
- Multi-tenant isolation
- SSO (OAuth2 + PKCE)
- MFA (TOTP)
- API tokens e SSH keys

## Diferencial Competitivo

| Feature               | CloudBuilder | Terraform Cloud | Pulumi | Spacelift |
| --------------------- | ------------ | --------------- | ------ | --------- |
| Canvas Visual          | ✅           | ❌              | ❌     | ❌        |
| FinOps Integrado       | ✅           | ❌              | ❌     | ❌        |
| Multi-Cloud Visual     | ✅           | Parcial         | ✅     | ✅        |
| AIOps Integrado        | ✅           | ❌              | ❌     | ❌        |
| Self-Service Devs      | ✅           | Limitado        | ✅     | ✅        |
| Governance Built-in    | ✅           | ✅              | Limitado | ✅     |

## Público-Alvo

- **Arquitetos de Solução** que querem tudo em um lugar só
- **Equipes DevOps/SRE** que precisam de visibilidade e automação
- **FinOps/Financeiro** que querem controlar custos de cloud
- **CTOs/Heads de Platform** que querem self-service para devs
- **Empresas em crescimento** que precisam de governança sem burocracia

## Stack Técnica

| Camada     | Tecnologia                                    |
| ---------- | --------------------------------------------- |
| Frontend   | React 19, TypeScript, Tailwind CSS, Zustand   |
| Backend    | Java 21, Spring Boot 3.4, Spring Modulith     |
| Engine     | Go 1.23, Cobra CLI, gRPC                      |
| Database   | PostgreSQL 16                                 |
| Cache      | Caffeine (in-memory)                          |
| Streaming  | Apache Kafka 3.7 (KRaft) — opcional           |
| Policy     | OPA (Open Policy Agent)                       |
