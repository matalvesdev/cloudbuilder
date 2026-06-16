# CloudBuilder — Roadmap 12 Meses

## Visão Geral do Roadmap

```
Q2 2026           Q3 2026           Q4 2026           Q1 2027
╔════════════════╗╔════════════════╗╔════════════════╗╔════════════════╗
║  FUNDAÇÃO      ║║  OPERAÇÕES    ║║  INTELIGÊNCIA  ║║  ESCALA        ║
║                ║║                ║║                ║║                ║
║ Design v1      ║║ Observe v1    ║║ AI v1          ║║ Multi-Region   ║
║ Provision v1   ║║ Cost v1       ║║ Platform v1    ║║ Enterprise     ║
║                ║║                ║║                ║║ Performance    ║
╚════════════════╝╚════════════════╝╚════════════════╝╚════════════════╝
```

---

## Trimestre 1: Foundation (Jun-Ago 2026)

**Objetivo**: MVP com Design + Provision funcional, open source no GitHub.

### Release 1.0.0 — "Canvas" (Sprint 1-3)

| Sprint | Período | Objetivo | Entregáveis |
|--------|---------|----------|-------------|
| S1 | Jun 08-19 | Setup do projeto | Repositórios, CI/CD, boilerplate Spring Modulith + React, Docker Compose |
| S2 | Jun 22-Jul 03 | Canvas base | ReactFlow integrado, paleta de componentes AWS, drag & drop básico |
| S3 | Jul 06-17 | Propriedades e conexões | Painel de propriedades, conexões entre componentes, grid snap |

**Dependências**: N/A  
**Critério de Aceite**: Usuário consegue arrastar componentes AWS, conectá-los e editar propriedades  
**Métricas**: Canvas renderiza 100 nodes >30fps

### Release 1.1.0 — "Validation" (Sprint 4-6)

| Sprint | Período | Objetivo | Entregáveis |
|--------|---------|----------|-------------|
| S4 | Jul 20-31 | Engine de validação | Validation rules core, indicadores visuais de erro |
| S5 | Ago 03-14 | Provedores multi-cloud | Azure + GCP + K8s components, provider plugin system |
| S6 | Ago 17-28 | Versionamento e export | Canvas versions, diff, export/import JSON/PNG |

**Dependências**: S3 (canvas funcional)  
**Critério de Aceite**: Validação detecta erros, suporte a 4 provedores  
**Métricas**: Validação <2s para 100 componentes

### Release 2.0.0 — "Terraform" (Sprint 7-9)

| Sprint | Período | Objetivo | Entregáveis |
|--------|---------|----------|-------------|
| S7 | Ago 31-Set 11 | Terraform Generator | Geração de .tf files do canvas, templates AWS |
| S8 | Set 14-25 | Provision Engine Go | gRPC server, execução terraform, deploy workflow |
| S9 | Set 28-Out 09 | State e drift | State management, drift detection, sync |

**Dependências**: S6 (multi-cloud), S7 (generator)  
**Critério de Aceite**: Canvas → Terraform → Deploy → Drift detectado  
**Métricas**: Geração <5s, deploy <30min (tipicamente)

---

## Trimestre 2: Operations (Out-Dez 2026)

**Objetivo**: Observabilidade + FinOps integrados ao design.

### Release 3.0.0 — "Observe" (Sprint 10-13)

| Sprint | Período | Objetivo | Entregáveis |
|--------|---------|----------|-------------|
| S10 | Out 12-23 | OpenTelemetry stack | OTel Collector, instrumentação automática Java, export |
| S11 | Out 26-Nov 06 | Métricas e dashboards | Prometheus + Grafana, dashboard builder |
| S12 | Nov 09-20 | Logs e traces | Loki log aggregation, Tempo tracing, correlação |
| S13 | Nov 23-Dez 04 | Alertas e SLOs | Alert rules, notification, SLO tracking |

**Dependências**: R2 (provision infra ativa para observar)  
**Critério de Aceite**: Recursos provisionados aparecem em dashboards com métricas/logs/traces  
**Métricas**: Ingestão de 10K metrics/s, <5s para query de log

### Release 4.0.0 — "Cost" (Sprint 14-17)

| Sprint | Período | Objetivo | Entregáveis |
|--------|---------|----------|-------------|
| S14 | Dez 07-18 | Cost ingestion | Billing data ingestion (AWS CUR, Azure, GCP) |
| S15 | Jan 04-15 | Cost Explorer | UI de exploração de custos, breakdown por recurso |
| S16 | Jan 18-29 | Budgets e forecasts | Budget management, ML forecast |
| S17 | Fev 01-12 | Anomalias e recomendações | Cost anomaly detection, optimization recommendations |

**Dependências**: S13 (para ter recursos sendo observados)  
**Critério de Aceite**: Usuário vê custos por recurso/ambiente, recebe recomendações  
**Métricas**: Custo tracking <15min latency, forecast accuracy >85%

---

## Trimestre 3: Intelligence (Jan-Mar 2027)

**Objetivo**: AIOps + Platform Catalog.

### Release 5.0.0 — "Platform" (Sprint 18-20)

| Sprint | Período | Objetivo | Entregáveis |
|--------|---------|----------|-------------|
| S18 | Fev 15-26 | Service Catalog | Catalog CRUD, publish workflow, versioning |
| S19 | Mar 01-12 | Golden Paths | Template system, scaffolding, input schemas |
| S20 | Mar 15-26 | Policy Engine | OPA/Rego integration, policy evaluation |

**Dependências**: S6 (component definitions), S17 (cost data)  
**Critério de Aceite**: Dev solicita infra via catalog, política bloqueia não-compliant  
**Métricas**: Self-service request → infra em <30min

### Release 6.0.0 — "AIOps" (Sprint 21-23)

| Sprint | Período | Objetivo | Entregáveis |
|--------|---------|----------|-------------|
| S21 | Mar 29-Abr 09 | Incident analysis | Incident integration, classification, summarization |
| S22 | Abr 12-23 | Root Cause Analysis | RCA engine, multi-signal correlation |
| S23 | Abr 26-Mai 07 | NL Query + Security | Natural language query, security analysis |

**Dependências**: S13 (observability data), S17 (cost data)  
**Critério de Aceite**: AI sugere causa raiz em <30s, NL query retorna resultados corretos  
**Métricas**: RCA accuracy >80%, MTTR reduction >40% (vs manual)

---

## Trimestre 4: Scale (Abr-Jun 2027)

**Objetivo**: Enterprise readiness, performance, multi-region.

### Release 7.0.0 — "Enterprise" (Sprint 24-26)

| Sprint | Período | Objetivo | Entregáveis |
|--------|---------|----------|-------------|
| S24 | Mai 10-21 | Multi-tenancy | Schema-per-tenant, tenant isolation validation |
| S25 | Mai 24-Jun 04 | RBAC + Audit | Fine-grained RBAC, audit trail UI, compliance reports |
| S26 | Jun 07-18 | SSO + Secrets | OIDC/SAML SSO, Vault integration, secrets management |

**Dependências**: Todos módulos anteriores  
**Critério de Aceite**: 500 tenants isolados, auditoria completa  
**Métricas**: Tenant isolation validated, audit event <1s

### Release 8.0.0 — "Performance" (Sprint 27-28)

| Sprint | Período | Objetivo | Entregáveis |
|--------|---------|----------|-------------|
| S27 | Jun 21-Jul 02 | Canvas performance | 500+ nodes at 60fps, virtualização, lazy loading |
| S28 | Jul 05-16 | API scalability | Horizontal scaling, connection pooling, cache optimization |

### Release 9.0.0 — "Multi-Region" (Sprint 29-30)

| Sprint | Período | Objetivo | Entregáveis |
|--------|---------|----------|-------------|
| S29 | Jul 19-30 | DR architecture | Cross-region deployment, failover, PITR |
| S30 | Ago 02-13 | Marketplace | Cloud marketplace listings, partner integrations |

---

## Summary of Releases

| Release | Module | Sprint | Timeline | Key Milestone |
|---------|--------|--------|----------|---------------|
| 1.0.0 | Design Base | S1-S3 | Jun-Jul 2026 | First canvas render |
| 1.1.0 | Design Pro | S4-S6 | Jul-Ago 2026 | Multi-cloud validation |
| 2.0.0 | Provision | S7-S9 | Set-Out 2026 | First Terraform deploy |
| 3.0.0 | Observe | S10-S13 | Out-Dez 2026 | Live monitoring |
| 4.0.0 | Cost | S14-S17 | Dez-Fev 2027 | Cost optimization |
| 5.0.0 | Platform | S18-S20 | Fev-Mar 2027 | Self-service portal |
| 6.0.0 | AIOps | S21-S23 | Mar-Mai 2027 | AI-powered RCA |
| 7.0.0 | Enterprise | S24-S26 | Mai-Jun 2027 | Enterprise ready |
| 8.0.0 | Performance | S27-S28 | Jun-Jul 2027 | High performance |
| 9.0.0 | Multi-Region | S29-S30 | Jul-Ago 2027 | Global scale |

## Team Structure Recommended

| Time | Tamanho | Responsabilidade |
|------|---------|------------------|
| Frontend | 3 Devs | React, ReactFlow, ShadCN, Tailwind |
| Backend (Java) | 5 Devs | Spring Modulith, APIs, módulos |
| Provision Engine | 2 Devs (Go) | Code generation, deployment engine |
| AI/ML | 2 Devs | LLM integration, RCA, recommendations |
| DevOps/Infra | 2 Devs | Kubernetes, CI/CD, observability |
| QA | 2 Devs | Test automation, E2E, performance |
| PM | 1 PM | Roadmap, stakeholder management |
| **Total** | **17** | |
