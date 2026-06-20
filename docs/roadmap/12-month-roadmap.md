# CloudBuilder — 12-Month Roadmap

**Período**: Q2 2026 – Q1 2027
**Team**: 17 engenheiros (9 squads)
**Framework**: FAANg (Future Autonomous AI Network for Engineering)

---

## Visão Geral

```
Q2 2026          Q3 2026          Q4 2026          Q1 2027
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ Foundation      │ Operations       │ Intelligence     │ Scale            │
│ Design v1       │ Observe v1       │ AI v1            │ Multi-Region     │
│ Provision v1    │ Cost v1          │ Platform v1      │ Enterprise       │
│ Auth/RBAC       │ Audit            │ Marketplace      │ Compliance       │
│ Onboarding      │ Docs             │ GitOps           │ Performance      │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

---

## Release 1 — Foundation (Sprints 1–8, Q2 2026) ✅ **COMPLETE**

| Sprint | Tema | Entregas | Status |
|--------|------|----------|--------|
| 1 | Canvas Core | ReactFlow canvas, node CRUD, undo/redo | ✅ |
| 2 | Design API | Backend hexagonal, REST API, validation | ✅ |
| 3 | Auth & RBAC | JWT, roles (admin/editor/viewer), multi-tenant | ✅ |
| 4 | Provision Core | Code generation (Terraform/OpenTofu) | ✅ |
| 5 | Go Engine | Provision engine gRPC, drift detection | ✅ |
| 6 | Nativization | 6 deps → nativo, on‑prem metrics | ✅ |
| 7 | Onboarding | Welcome, tour, gateway setup, docs | ✅ |
| 8 | Quality Gate | 496 tests, UUID→String migration, MVP report | ✅ |

**MVP Marco**: ✅ **Complete** — 496/496 testes, 0 TS errors, docker-compose 3 serviços

---

## Release 2 — Operations (Sprints 9–14, Q3 2026)

### Sprint 9 — Observabilidade Nativa
- **Backend**: AlertEvaluationService, Incident workflows, SLO engine
- **Frontend**: MetricsDashboard, AlertRulesView, IncidentsView
- **Infra**: Native logging (PostgresLogAppender), tracing (TraceContext)
- **Testes**: Alert rules + incident resolution E2E

### Sprint 10 — Cost Management
- **Backend**: Budget alerts, anomaly detection, cost projections
- **Frontend**: Budget comparison charts, cost anomaly indicators
- **What-if Cost**: Backend persistence + comparison across scenarios

### Sprint 11 — Audit & Compliance
- **Backend**: Advanced audit queries, compliance rules, report exports
- **Frontend**: Audit timeline, compliance dashboard
- **Infra**: Audit log partitioning (time-based)

### Sprint 12 — Auto-Documentation
- **Backend**: DocScanner improvements, cross-module linking, stale detection
- **Frontend**: Search enhancements, doc editing, ADR workflow
- **IA**: ADR content suggestions from canvas metadata

### Sprint 13 — Service Map & Scorecards
- **Backend**: ServiceMap API refinements, Scorecard criteria expansion
- **Frontend**: Interactive service map with drill-down, scorecard history

### Sprint 14 — Preview Workflow
- **Backend**: DeployPlan persistence, plan diff API, apply tracking
- **Frontend**: Plan comparison, deployment history timeline
- **Infra**: Plan approval workflow (admin gate)

---

## Release 3 — Intelligence (Sprints 15–21, Q4 2026)

### Sprint 15 — AI Assistant
- **Backend**: AIOpsService with LLM integration (OpenAI/Anthropic)
- **Frontend**: AIChatPanel improvements, context-aware suggestions
- **IA**: Anomaly detection from metrics + logs

### Sprint 16 — Platform Catalog
- **Backend**: CatalogItem CRUD, template versioning, publishing
- **Frontend**: Template browser, one-click design from template
- **Marketplace**: Public/private listing, partner integrations

### Sprint 17 — Marketplace
- **Backend**: MarketplaceListing, PartnerIntegration APIs
- **Frontend**: Marketplace browser, install wizard, ratings
- **Payment**: Pix/Stripe integration (if monetized)

### Sprint 18 — GitOps Integration
- **Backend**: GitScanner enhancements, webhook handling
- **Frontend**: Git provider management, commit visualization
- **CI/CD**: GitHub Actions pipeline for IaC

### Sprint 19 — Incident Intelligence
- **Backend**: Auto-remediation suggestions, runbook integration
- **Frontend**: Incident timeline, post-mortem generation
- **IA**: Root cause analysis from metrics + logs + traces

### Sprint 20 — Performance Optimization
- **Frontend**: Bundle analysis, lazy loading audit, Core Web Vitals
- **Backend**: Query optimization, N+1 detection, caching
- **Infra**: CDN setup, image optimization

### Sprint 21 — Security Hardening
- **Backend**: SAST/DAST pipeline, dependency scanning
- **Infra**: Secrets management (Vault), TLS everywhere
- **Auth**: MFA/2FA, session management, audit logging

---

## Release 4 — Scale (Sprints 22–30, Q1 2027)

### Sprint 22–23 — Multi-Region
- **Backend**: Region management, failover groups, DR plans
- **Frontend**: Region topology view, failover controls
- **Infra**: Cross-region replication, DNS failover

### Sprint 24–25 — Enterprise Features
- **Backend**: SSO/SAML, SCIM provisioning, org hierarchy
- **Frontend**: Admin console, audit export, user management
- **Auth**: OIDC provider support

### Sprint 26–27 — Compliance & Governance
- **Backend**: Policy as Code (OPA), compliance frameworks
- **Frontend**: Policy editor, compliance scorecards
- **Infra**: Evidence collection, report automation

### Sprint 28–29 — Performance at Scale
- **Backend**: Read replicas, sharding, connection pooling
- **Frontend**: Virtual scrolling, infinite query, data caching
- **Infra**: Auto-scaling, load testing (k6)

### Sprint 30 — Platform Stabilization
- **Bug fixes**: All P0/P1 bugs resolved
- **Documentation**: Runbooks, architecture, user guides
- **Monitoring**: SLI/SLO dashboards, alert tuning
- **Retrospective**: FAANg process improvements

---

## Resumo de Esforço

| Release | Sprints | Files Estimados | Testes Estimados | Dependências |
|---------|---------|-----------------|------------------|--------------|
| R1 Foundation | 8 | ~400 | 496 | Nenhuma |
| R2 Operations | 6 | ~120 | +250 | Native obs |
| R3 Intelligence | 7 | ~150 | +300 | LLM API key |
| R4 Scale | 9 | ~200 | +350 | Cloud infra |

---

## Marcos Chave

| Data | Marco | Dependência |
|------|-------|-------------|
| Jun 2026 | ✅ **MVP** — Foundation complete | — |
| Set 2026 | Operations Release | Native obs infra |
| Dez 2026 | Intelligence Release | LLM integration |
| Mar 2027 | Scale Release | Cloud resources |

---

## Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| LLM integration delay | Média | Alto | AIOpsService com fallback rule-based |
| Multi-region complexity | Alta | Alto | DR tests incrementais por região |
| Enterprise SSO setup | Média | Médio | SAML library testada em módulo isolado |
| Performance at scale | Média | Alto | k6 testing desde R2 |
| Team capacity | Média | Médio | 9 squads, priorização trimestral |

---

*Roadmap gerado por FAANg — Sisyphus em 2026-06-19. Atualizado conforme avanço das releases.*
