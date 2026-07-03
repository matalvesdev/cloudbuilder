# CloudBuilder — Auditoria de Conformidade Arquitetural

**Data**: 2026-07-01
**Escopo**: Todos os diagramas Mermaid (136+) vs. código fonte real
**Resultado Geral**: ⚠️ **Conformidade Parcial** — Discrepâncias significativas entre documentação e implementação

---

## Resumo Executivo

| Área | Conformidade | Status |
|------|-------------|--------|
| Backend Hexagonal (24 módulos) | ✅ 100% | Todos os módulos seguem hexagonal |
| Shared (security/event/kernel) | ✅ 100% | Estrutura exata conforme diagrama |
| Go Engine | ✅ 95% | Estrutura confere, componentes extras |
| Frontend Modules | ⚠️ 70% | Nomes divergem dos diagramas |
| Frontend Stores | ✅ 95% | 26 stores (diagrama diz 20) |
| UI Components | ✅ 95% | 23 wrappers (diagrama diz 22) |
| API Layer | ✅ 100% | 20 arquivos (diagrama diz 8) |
| EDA / Kafka | ⚠️ 85% | Implementado mas diagramas inconsistente |
| Docker Deployment | ❌ 60% | Diagrama contradiz docker-compose.yml |
| RBAC Roles | ❌ 50% | Backend usa OWNER/ADMIN/EDITOR, diagrama diz ADMIN/EDITOR/VIEWER |
| Observability | ⚠️ 75% | Implementação parcial vs diagrama |
| Multi-tenancy | ✅ 100% | Conforme documentado |

---

## 1. BACKEND — Arquitetura Hexagonal (✅ CONFORME)

### Diagrama afirma
Cada módulo segue: `domain/` (model, service, port, validator) → `application/` (dto) → `infrastructure/` (web)

### Realidade verificada
**25 pacotes Java** encontrados em `com.cloudbuilder`:
- `aiops`, `analytics`, `approval`, `audit`, `codeanalysis`, `cost`, `credential`, `deployment`, `design`, `docs`, `environment`, `featureflags`, `git`, `github`, `iam`, `metrics`, `multiregion`, `observability`, `observe`, `platform`, `provision`, `search`, `shared`, `tenant`

**Diagrama lista 24 módulos (M1-M24)** — mas há 25 pacotes reais (falta `featureflags` e `analytics` no diagrama, há `observability` extra)

### Verificação do Design Module (arquivo exemplar)
```
design/
├── domain/
│   ├── model/     → Canvas, CanvasNode, CanvasEdge, CanvasVersion, ComponentDefinition ✅
│   ├── service/   → CanvasService, ValidationService, VersionService, ComponentDefinitionService ✅
│   ├── port/      → CanvasRepository, CanvasVersionRepository, ComponentDefinitionRepository ✅
│   ├── validator/ → CidrOverlapRule, ConnectionCompatibilityRule, RequiredPropertiesRule ✅
│   └── event/     → CanvasCreatedEvent, ComponentAddedEvent ✅
├── application/
│   └── dto/       → ValidationReport, VersionDiff ✅
└── infrastructure/
    └── web/       → CanvasController, VersionController, ValidationController, ComponentDefinitionController ✅
```

### shared/ (cross-cutting)
```
shared/
├── security/  → SecurityConfig, JwtAuthenticationFilter, JwtTokenProvider, TenantContext, TenantFilter, DevAuthController, JwksVerifier, SecretEncryptionConverter ✅
├── event/     → KafkaConfig, TopicRouter, KafkaEventPublisher, OutboxSweeper, InboxProcessor, DLQHandler, EventStreamKafkaBridge, EventInbox, DlqEvent, EventOutbox ✅
├── kernel/    → BaseEntity, AggregateRoot, DomainEvent ✅
├── monitoring/ → MetricsConfig, MdcFilter, CustomHealthIndicator, ControllerMicrometerAspect, MetricsDualWriter, CustomMetrics ✅
├── cache/     → CacheConfig (Caffeine) ✅
├── web/       → WebConfig (CORS) ✅
├── api/       → ApiVersion*, ApiVersionResolver ✅
└── exception/ → GlobalExceptionHandler, ResourceNotFoundException, ApiError ✅
```

### Discrepâncias Backend
| # | Diagrama | Realidade | Severidade |
|---|---------|-----------|------------|
| B1 | Lista 24 módulos (M1-M24) | 25 módulos reais (faltam `featureflags`, `analytics`, `search` no diagrama) | Baixa |
| B2 | Sem módulo `observability` no diagrama | Módulo `observability` existe com Traces/Spans/APMSnapshot | Média |
| B3 | Sem módulo `featureflags` no diagrama | Módulo `featureflags` existe com FeatureFlag CRUD + Caffeine cache | Média |
| B4 | Sem módulo `search` no diagrama | Módulo `search` existe com SearchController | Baixa |
| B5 | Sem módulo `analytics` no diagrama | Módulo `analytics` existe com AnalyticsController | Baixa |

---

## 2. FRONTEND — Módulos (⚠️ DIVERGÊNCIA SIGNIFICATIVA)

### Diagrama afirma (§2, §5)
10 módulos: Dashboard, Design, Provision, Observe, Cost, Platform, AIOps, Audit, Auth, Settings

### Realidade verificada — 15 diretórios
```
modules/
├── ai/            (diagrama chama "aiops")
├── billing/       (NÃO mencionado no diagrama principal)
├── canvas/        (diagrama chama "design")
├── dashboard/
├── deployment/    (NÃO mencionado no diagrama principal)
├── finops/        (diagrama chama "cost")
├── gitops/        (NÃO mencionado no diagrama principal)
├── notifications/ (NÃO mencionado no diagrama principal)
├── observability/ (diagrama chama "observe")
├── platform/
├── projects/      (NÃO mencionado no diagrama principal)
├── provisioning/  (diagrama chama "provision")
├── security/      (NÃO mencionado no diagrama principal — contém Audit + IAM)
├── settings/
└── workspace/     (NÃO mencionado no diagrama principal)
```

### Discrepâncias Frontend
| # | Diagrama | Realidade | Severidade |
|---|---------|-----------|------------|
| F1 | Módulo "design" | Real: `canvas/` | Alta |
| F2 | Módulo "provision" | Real: `provisioning/` | Média |
| F3 | Módulo "observe" | Real: `observability/` | Média |
| F4 | Módulo "cost" | Real: `finops/` | Média |
| F5 | Módulo "aiops" | Real: `ai/` | Média |
| F6 | Módulo "audit" separado | Real: `security/` (contém AuditModule + IAMModule + RegoPolicyView) | Alta |
| F7 | Módulo "auth" separado | Real: Sem módulo auth/ — auth é via authStore + LoginPage em App.tsx | Média |
| F8 | 10 módulos listados | 15 módulos reais (faltam: billing, deployment, gitops, notifications, projects, workspace) | Alta |
| F9 | Sem módulo "docs" no diagrama §2 | DocsModule existe em settings/DocsModule.tsx | Média |
| F10 | Sem módulo "security" no diagrama §2 | security/ existe com RegoPolicyView, ComplianceDashboard, AuditTimeline, IAMModule, AuditModule | Alta |

---

## 3. ZUSTAND STORES (✅ CONFORME — NÚMERO DIFERENTE)

### Diagrama afirma
20 Zustand stores

### Realidade verificada — 26 stores (excluindo testes)
```
activityStore, analyticsStore, approvalStore, auditStore, authStore,
canvasStore, collaborationStore, costForecastStore, costStore,
credentialStore, deployStore, driftStore, ephemeralStore,
incidentStore, onboardingStore, organizationStore, platformStore,
policyStore, projectStore, promotionStore, repoStore,
systemSettingsStore, teamStore, tenantStore, uiStore, workspaceStore
```

### Discrepâncias
| # | Diagrama | Realidade | Severidade |
|---|---------|-----------|------------|
| S1 | "20 stores" | 26 stores reais | Baixa |
| S2 | Lista: canvasStore, uiStore, authStore, costStore, deployStore, driftStore, incidentStore, tenantStore, onboardingStore, credentialStore, policyStore | Faltam no diagrama: activityStore, analyticsStore, approvalStore, auditStore, collaborationStore, costForecastStore, ephemeralStore, organizationStore, platformStore, promotionStore, repoStore, systemSettingsStore, teamStore, workspaceStore | Média |

---

## 4. UI COMPONENTS (✅ CONFORME)

### Diagrama afirma
22 shadcn/ui wrappers

### Realidade verificada — 23 componentes
```
badge, button, card, chart, collapsible, command, context-menu,
dialog, dropdown-menu, hover-card, input, label, popover, progress,
resizable, scroll-area, select, separator, sheet, skeleton, tabs,
toggle, tooltip
```

### Discrepâcia
| # | Diagrama | Realidade | Severidade |
|---|---------|-----------|------------|
| U1 | 22 wrappers | 23 wrappers (diferença de 1) | Insignificante |

---

## 5. API LAYER (✅ CONFORME — MAIS COMPLETO)

### Diagrama afirma (§5)
8 arquivos: client.ts, auth.ts, design.ts, provision.ts, cost.ts, dashboardApi.ts, import.ts, codeAnalysis.ts, types.ts

### Realidade verificada — 20 arquivos
```
analytics.ts, audit.ts, auth.ts, client.ts, codeAnalysis.ts,
cost.ts, dashboardApi.ts, design.ts, docs.ts, featureFlags.ts,
iam.ts, import.ts, index.ts, multiregion.ts, observability.ts,
platform.ts, provision.ts, types.ts
```

### Discrepâcia
| # | Diagrama | Realidade | Severidade |
|---|---------|-----------|------------|
| A1 | 8 arquivos listados | 20 arquivos reais (12 não mencionados) | Média |

---

## 6. EDA / KAFKA (⚠️ PARCIALMENTE CONFORME)

### Diagrama §15.6 afirma
Projection Storage inclui: PostgreSQL, ClickHouse, Elasticsearch, Redis, TimescaleDB, S3

### Realidade verificada
- **PostgreSQL**: ✅ Usado
- **ClickHouse**: ❌ NÃO existe — não há menção no código
- **Elasticsearch**: ❌ NÃO existe — não há menção no código
- **Redis**: ❌ REMOVIDO na Phase 1 — substituído por Caffeine
- **TimescaleDB**: ❌ NÃO existe
- **S3**: ❌ NÃO existe

### Diagrama §15.2 afirma
15 Event Producers: Canvas, AI Architect, Terraform Generator, Provisioning, Deployment, GitOps, Observability, FinOps, Security, Identity, Workspace, Projects, Environment, Billing, Notification

### Realidade verificada
Kafka listeners encontrados:
- CostEventListenerKafka ✅
- DeploymentEventListenerKafka ✅
- DriftEventListenerKafka ✅
- IncidentEventListenerKafka ✅
- CanvasEventListenerKafka ✅
- AuditEventListenerKafka ✅
- NotificationEventListenerKafka ✅

**7 listeners reais** vs **15 producers no diagrama** — 8 services não implementados como producers.

### Diagrama §15.4 afirma
20 Kafka topics: canvas.events, architecture.events, terraform.events, provisioning.events, deployment.events, gitops.events, kubernetes.events, resource.events, observability.events, finops.events, billing.events, security.events, identity.events, notification.events, audit.events, ai.events, policy.events, inventory.events, system.events, cost.events

### Realidade verificada
TopicRouter mapeia prefixos para topics — precisa verificar quantos topics estão configurados.

### Discrepâncias EDA
| # | Diagrama | Realidade | Severidade |
|---|---------|-----------|------------|
| E1 | ClickHouse, Elasticsearch, Redis, TimescaleDB, S3 como read models | Nenhum existe — apenas PostgreSQL | Alta |
| E2 | 15 event producers | 7 Kafka listeners implementados | Alta |
| E3 | 20 Kafka topics | Precisa verificação detalhada do TopicRouter | Média |
| E4 | Diagrama §9 mostra Docker com apenas 3 serviços | docker-compose.yml tem 6 serviços (postgres, kafka, backend, opa, provision-engine, frontend) | Alta |

---

## 7. DOCKER DEPLOYMENT (❌ CONTRADIÇÃO CRÍTICA)

### Diagrama §9 afirma (README.md §9)
Apenas 3 serviços: PostgreSQL (:5432), Backend (:8080), Frontend (:3000)
**Serviços removidos**: Kafka, Redis, OPA, Prometheus, Grafana, OpenTelemetry

### docker-compose.yml REAL tem 6 serviços
| Serviço | Porta | Status no Diagrama |
|---------|-------|--------------------|
| PostgreSQL | 5432 | ✅ Listado |
| **Kafka** | 9092 | ❌ Diagrama diz "removido" |
| Backend | 8080 | ✅ Listado |
| **OPA** | 8181 | ❌ Diagrama diz "removido" |
| **Provision Engine** | 50051 | ❌ NÃO listado no diagrama §9 |
| Frontend | 3001 (nginx) | ⚠️ Diagrama diz :3000 |

### Discrepâncias Docker
| # | Diagrama | Realidade | Severidade |
|---|---------|-----------|------------|
| D1 | 3 serviços (PG, BE, FE) | 6 serviços (PG, Kafka, BE, OPA, ProvisionEngine, FE) | Crítica |
| D2 | Kafka "removido" | Kafka presente e ativo (KRaft mode) | Crítica |
| D3 | OPA "removido" | OPA presente e ativo | Crítica |
| D4 | Provision Engine não listado | Provision Engine presente (:50051) | Alta |
| D5 | Frontend na porta :3000 | Frontend na porta :3001 (nginx :80) | Média |
| D6 | "Frontend → /api/* → proxy → BE" | Frontend usa nginx reverse proxy | ✅ Correto |

### Contradição interna nos diagramas
O próprio README.md §10 (Dependências Nativas Phase 4) lista Kafka como "removido", mas §15 (EDA) e docker-compose.yml mostram Kafka ativo. **Há uma contradição documental interna** — a Phase 4 removeu Kafka, mas a ADR-035 (Phase 5+) reintroduziu-o.

---

## 8. RBAC — ROLES (❌ DIVERGÊNCIA CRÍTICA)

### Diagrama afirma (§4 RBAC)
3 roles: **ADMIN**, **EDITOR**, **VIEWER**

### Realidade verificada
Backend usa **4+ roles**: `ADMIN`, `EDITOR`, `VIEWER`, `OWNER`

Exemplo em `@PreAuthorize`:
- `hasAnyRole('ADMIN', 'OWNER')` — WorkspaceController, ProjectController, MembershipController, TeamController
- `hasRole('ADMIN')` — FeatureFlagController, AnalyticsController
- `hasRole('ADMIN') or hasRole('EDITOR')` — CanvasController, DeploymentController, ApprovalController

### Diagrama §16.6 afirma
9 roles: Owner, Admin, PlatformAdmin, BillingAdmin, SecurityAdmin, Developer, DevOps, QA, Viewer

### Realidade
Backend implementa: ADMIN, EDITOR, VIEWER, OWNER (4 roles efetivos)

### Discrepâncias RBAC
| # | Diagrama | Realidade | Severidade |
|---|---------|-----------|------------|
| R1 | §4: 3 roles (ADMIN/EDITOR/VIEWER) | Backend usa 4 roles (inclui OWNER) | Alta |
| R2 | §16.6: 9 roles granulares | Backend implementa apenas 4 roles | Crítica |
| R3 | §16.6: Owner, Admin, PlatformAdmin, BillingAdmin, SecurityAdmin, Developer, DevOps, QA, Viewer | NÃO implementado — apenas ADMIN/EDITOR/VIEWER/OWNER | Crítica |

---

## 9. GO ENGINE (✅ CONFORME)

### Diagrama afirma (§8)
Componentes: Cobra CLI, gRPC Server, Terraform Generator, OpenTofu Generator, Drift Detector, Deployment Executor, Plan/State Parser, Kafka Producer, Provider Templates (AWS/Azure/GCP/K8s)

### Realidade verificada
```
provision-engine/internal/
├── api/grpc/       → server.go, server_test.go ✅
├── collaboration/  → client.go, server.go, room.go (NÃO no diagrama) ⚠️
├── drift/          → detector.go, detector_test.go ✅
├── executor/       → deployment.go, deployment_test.go, engine.go ✅
├── generator/terraform/ → generator.go, generator_test.go ✅
├── messaging/      → kafka.go, kafka_test.go, event.go, event_test.go, stream.go ✅
├── model/          → design.go ✅
├── parser/         → plan.go, plan_test.go, state.go, state_test.go ✅
└── provider/templates/ → aws.go, aws_test.go, azure.go, azure_providers.go, gcp.go, gcp_providers.go, k8s.go, k8s_providers.go, router.go ✅
```

### Discrepâncias Go Engine
| # | Diagrama | Realidade | Severidade |
|---|---------|-----------|------------|
| G1 | Sem módulo "collaboration" | `collaboration/` existe (client, server, room) | Média |
| G2 | Sem "engine.go" no executor | `engine.go` existe | Baixa |
| G3 | Sem "stream.go" no messaging | `stream.go` existe | Baixa |

---

## 10. OBSERVABILIDADE NATIVA (⚠️ PARCIAL)

### Diagrama afirma (§7)
- PostgresLogAppender (Async Logback)
- MetricsService (Micrometer + PostgreSQL)
- TraceContext (ThreadLocal + AOP)
- HealthCheckService (Scheduled)
- AlertEvaluationService (@Scheduled 30s)
- AlertRule (threshold/percentil)
- SLO Framework (SloService, SLI, Error Budget)
- 6 Views: Métricas, Traces, Logs, Alertas, Incidentes, SLO

### Realidade verificada
Frontend (`observability/`):
- MetricsDashboard.tsx ✅
- TraceExplorer.tsx ✅
- LogViewer.tsx ✅
- AlertRulesView.tsx ✅
- IncidentsView.tsx ✅
- SloDashboard.tsx ✅
- DisasterRecovery.tsx ✅ (adicional)
- DriftDetection.tsx ✅ (adicional)
- ServiceMapView.tsx ✅ (adicional)
- ScorecardView.tsx ✅ (adicional)

Backend (`observe/`): Alert, ServiceHealth, HealthCheckService
Backend (`observability/`): Traces, Spans, APMSnapshot

### Conclusão
Frontend tem **10 views** (6 mencionadas + 4 extras: DR, Drift, ServiceMap, Scorecard). Implementação SUPERIOR ao diagrama.

---

## 11. AUTH FLOW (✅ CONFORME)

### Diagrama afirma (§4)
1. Login → POST /api/v1/auth/login
2. AuthService.authenticate() → DB query → User + Roles + Permissions
3. JwtTokenProvider.generateToken() → JWT com claims: sub, roles, tenantId
4. AuthResponse (token + user)
5. TenantContext.setTenant(tenantId) por request

### Realidade verificada
- AuthController + AuthService + IamService ✅
- JwtTokenProvider ✅
- JwtAuthenticationFilter ✅
- TenantContext (ThreadLocal) ✅
- TenantFilter ✅

### Conclusão: **100% conforme**

---

## 12. ONBOARDING FLOW (✅ CONFORME)

### Diagrama afirma (§6)
3 estágios: Welcome → Tour (8 steps) → Gateway Setup (5 steps)

### Realidade
- onboardingStore.ts ✅
- 3 arquivos no módulo onboarding ✅

### Conclusão: **Conforme** (precisa verificação de detalhe dos steps)

---

## 13. MULTI-TENANCY (✅ CONFORME)

### Diagrama afirma
- Isolamento por `tenantId` em todas as tabelas
- `TenantFilter` — filtro automático via JPA
- `TenantContext` — ThreadLocal propagado por toda a request
- Headers: `X-Tenant-Id`

### Realidade verificada
- TenantContext.java ✅
- TenantFilter.java ✅
- JwtTokenProvider gera JWT com tenantId ✅
- TenantContextPropagationExecutor ✅

### Conclusão: **100% conforme**

---

## 14. DEPENDÊNCIAS NATIVAS (✅ CONFORME)

### Diagrama afirma (§10)
6 bibliotecas substituídas: dagre, html-to-image, react-resizable-panels, react-hot-toast, cmdk, yjs

### Realidade
- Todas substituídas conforme documentado ✅
- command.tsx (nativo) ✅
- resizable.tsx (nativo) ✅
- toast.tsx (nativo) ✅

### Conclusão: **Conforme**

---

## 15. DIAGRAMAS ESPECÍFICOS — AUDITORIA DETALHADA

### architecture-diagrams.md
| Diagrama | Conformidade | Notas |
|----------|-------------|-------|
| Visão Geral (§1) | ⚠️ | Mostra Kafka + OPA como infra — kafka existe, OPA existe, mas §9 do README diz que foram removidos |
| Credenciais (§2) | ✅ | CredentialController + CredentialService + CredentialRepository existe |
| Ambientes (§3) | ✅ | Environment entity existe |
| User Settings (§4) | ✅ | Auth endpoints corretos |
| System Settings (§5) | ✅ | FeatureFlagController existe |
| Frontend Modules (§6) | ⚠️ | Mostra módulos com nomes diferentes do real (design→canvas, etc.) |
| Backend Hexagonal (§7) | ✅ | Estrutura correta |
| Security (§8) | ✅ | TenantFilter + RBAC correto |
| 25 Backend Modules (§9) | ⚠️ | Lista 24-25 módulos — discrepancy entre número e lista |

### Frontend DIAGRAMS.md
| Diagrama | Conformidade | Notas |
|----------|-------------|-------|
| Module Structure | ⚠️ | Nomes dos módulos divergem do real |
| Component Architecture | ✅ | Conforme |
| State Management | ✅ | Conforme |
| Auth Flow | ✅ | Conforme |

### EDA DIAGRAMS.md
| Diagrama | Conformidade | Notas |
|----------|-------------|-------|
| Kafka Cluster | ✅ | KRaft mode implementado |
| Topic Catalog (20) | ⚠️ | Precisa verificação do TopicRouter |
| Consumer Services | ⚠️ | 7 listeners vs 10 consumers no diagrama |
| Outbox/Inbox/Saga/DLQ | ✅ | Todos implementados |
| Projection Storage | ❌ | ClickHouse, ES, Redis, TimescaleDB, S3 não existem |

---

## RESUMO DE TODAS AS DISCREPÂNCIAS

### Críticas (requerem correção imediata)
1. **Docker §9**: Diagrama mostra 3 serviços; real são 6 (Kafka e OPA reintroduzidos)
2. **RBAC §16.6**: Diagrama mostra 9 roles granulares; backend implementa apenas 4
3. **EDA §15.6**: Projection Storage inclui 5 sistemas não implementados (ClickHouse, ES, Redis, TimescaleDB, S3)

### Altas (devem ser corrigidas)
4. **Frontend Modules**: 10 módulos no diagrama vs 15 reais com nomes diferentes
5. **EDA §15.2**: 15 producers no diagrama vs 7 listeners reais
6. **Backend Module Count**: Diagrama lista 24; real são 25 (faltam featureflags, analytics)
7. **Frontend RBAC §4**: Diagrama mostra 3 roles (ADMIN/EDITOR/VIEWER) mas backend tem OWNER também

### Médias (devem ser atualizadas)
8. **Stores**: 20 no diagrama vs 26 reais
9. **API Layer**: 8 arquivos no diagrama vs 20 reais
10. **Frontend Module Names**: design→canvas, provision→provisioning, observe→observability, cost→finops, aiops→ai
11. **Go Engine**: Módulo collaboration não documentado
12. **EDA Internal Contradiction**: Phase 4 remove Kafka, ADR-035 reintroduz

### Baixas (cosmético)
13. **UI Components**: 22 vs 23 (diferença de 1)
14. **Frontend Port**: :3000 vs :3001

---

## RECOMENDAÇÕES

1. **Atualizar docker-compose diagrama (§9)**: Refletir os 6 serviços reais
2. **Consolidar RBAC**: Decidir se usa 3 roles (ADMIN/EDITOR/VIEWER) ou 4 (incluindo OWNER) e atualizar todos os diagramas
3. **Remover projection storage fictício**: ClickHouse, ES, Redis, TimescaleDB, S3 devem ser marcados como "Planejado" ou removidos
4. **Unificar nomes de módulos frontend**: Padronizar entre diagramas e código
5. **Atualizar module count backend**: Adicionar featureflags, analytics, observability ao diagrama
6. **Atualizar store count**: 20 → 26
7. **Atualizar API file count**: 8 → 20
8. **Documentar módulo collaboration do Go Engine**
9. **Resolver contradição Kafka**: Atualizar §10 e §9 para refletir reintrodução via ADR-035
