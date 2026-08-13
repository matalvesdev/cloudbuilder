# CloudBuilder — Visão Geral do Produto

## O que é o CloudBuilder

O CloudBuilder é uma plataforma web que centraliza todas as etapas do ciclo de vida da infraestrutura cloud:

```
Design → Validate → Generate Code → Plan → Deploy → Observe → Optimize → Govern
```

## Módulos do Produto

### 🎨 Design Module
- Canvas visual com drag-and-drop (ReactFlow)
- Suporte a 4 providers: AWS, Azure, GCP, Kubernetes
- Validação em tempo real (CIDR overlap, connection compatibility, naming)
- Preview de código Terraform antes de gerar
- Versionamento com undo/redo

### ⚙️ Provision Module
- Geração automática de Terraform (main.tf, variables.tf, outputs.tf, providers.tf)
- Deploy pipeline com aprovação
- Ambientes efêmeros para testes
- Drift detection automático

### 📊 Observe Module
- Dashboard de saúde dos serviços
- Service Map visual (ReactFlow)
- Scorecards de maturidade (HA, Security, Cost, Scalability, Observability, Documentation)
- Alertas com ciclo de vida (OPEN → ACKNOWLEDGED → RESOLVED)
- SLO/SLI tracking

### 💰 Cost Module (FinOps)
- Dashboard de custos com breakdown por provider/service
- Anomaly detection (7-day moving average + std dev)
- What-if analysis (3-tier: min/avg/max)
- Budget alerts (80%/100%)
- Otimizações sugeridas

### 🤖 AIOps Module
- Assistente IA para diagnóstico de incidentes
- Auto-remediation suggestions
- Classificação automática de incidentes
- Runbooks integrados

### 🏪 Platform Module
- Catálogo de templates de infraestrutura
- Marketplace de integrações
- Partner ecosystem

### 🔐 IAM Module
- RBAC com 3 roles (admin, editor, viewer)
- Multi-tenant com isolamento por tenant
- SSO (OAuth2 + PKCE)
- MFA (TOTP)
- API tokens e SSH keys

### 📋 Audit Module
- Trilha de auditoria completa
- Logs de ações por usuário
- Compliance reporting

### 📖 Docs Module
- Visualizador de documentação Markdown
- Importação de .md files
- Geração automática de ADRs
- Alertas de documentação desatualizada

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
| Container  | Docker Compose                                |
