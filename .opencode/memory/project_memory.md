# Project Memory

## CloudBuilder — Platform Engineering Platform
Última atualização: 2026-06-19

## Stack
- **Frontend**: React 19 + TypeScript + ReactFlow v12 (@xyflow/react) + Tailwind CSS + Vite + Zustand + shadcn/ui
- **Backend**: Java 21 + Spring Boot 3.4.4 + Spring Modulith + Maven + H2 (test) + PostgreSQL 16 (prod)
- **Engine**: Go 1.22 + Cobra CLI + gRPC
- **Observability**: Native (PostgreSQL — metrics_ts, traces, spans, logs, alert_rules, SLOs)
- **Cache**: Caffeine (in-memory, substituiu Redis)
- **Streaming**: Spring events + gRPC (substituiu Kafka)
- **Container**: Docker (docker-compose, 3 serviços: postgres + backend + frontend)

## Test Status (Finalizado)
| Layer | Tests | Status |
|-------|-------|--------|
| Backend (JUnit 5) | 496 | ✅ 100% pass |
| Frontend (Vitest) | 62 | ✅ 100% pass |
| Go Engine | 23 | ✅ 100% pass |
| E2E (Playwright) | 6 | ✅ 100% pass |

## Módulos Backend (todos completos)
- **design** — canvas CRUD, validação (6 regras), versões, componentes (hexagonal, 26 files)
- **provision** — geração Terraform/OpenTofu, drift detection, state, DR, ephemeral, DeployPlan (47 files)
- **iam** — auth JWT, roles (admin/editor/viewer), permissions, tenants, password reset (24 files)
- **observe** — health checks, alerts, ServiceMap, Scorecards, native observability schema (10 files)
- **cost** — budgets, records, CostScenario persistence, overview (7 files)
- **platform** — Catalog, Marketplace, Partner integrations (10 files)
- **aiops** — incident management, AI assistant, fix history (11 files)
- **git** — Git scanner, IaC detector, pipeline generator (20 files)
- **github** — GitHub OAuth service, API client, controller (8 files)
- **multiregion** — Region, DR, DRTest, RegionHealth (21 files)
- **tenant** — Project, ProjectMember (9 files)
- **audit** — AuditEvent, @Audited AOP (5 files)
- **apm** — Traces, Spans, APMSnapshot (5 files)
- **metrics** — MetricPoint, MetricsSnapshot, ResourceMetrics (6 files)
- **codeanalysis** — CodeAnalyzerService (4 files)
- **docs** — DocScanner, AutoDoc, ADR generation (6 files)
- **shared/** — security (JWT filter, TenantFilter, rate limiting), event bus, monitoring

## Módulos Frontend (todos completos)
- **design** ✅ — Canvas ReactFlow, Palette, Properties, AI Chat, Code Preview (54 files)
- **auth** ✅ — Login, Register (com verificação email), Forgot/Reset Password, TenantSelector (4 files)
- **settings** ✅ — Profile, System, Credentials, Environments, Repositories (3 files)
- **dashboard** ✅ — Métricas reais, "Primeiros Passos" onboarding cards (3 files)
- **provision** ✅ — Terraform executor, deploy, CI/CD, Preview Workflow (10 files)
- **cost** ✅ — Dashboard, otimizações, What-if Cost (desmocado, API real) (1 file)
- **observe** ✅ — Métricas, Traces, Logs, Alertas, Incidentes, SLO, ServiceMap, Scorecards, Drift, DR (3 files)
- **platform** ✅ — Catalog + Políticas (desmocado, API real) (1 file)
- **aiops** ✅ — AI assistant + incident fix (desmocado, API real) (2 files)
- **audit** ✅ — Tabela de eventos de auditoria (1 file)
- **iam** ✅ — Gerenciamento de identidade (1 file)
- **docs** ✅ — Sidebar tree, search, import, markdown viewer, ADR generation (2 files)

## Feature Flags & Config
- Rate limiting: auth 10 req/min/IP, global 500 req/min/IP (configurável via application.yml)
- H2 console: apenas dev (via `cloudbuilder.security.h2-console-enabled`)
- CORS: configurável via `cloudbuilder.security.cors-allowed-origins` (default `http://localhost:3000,http://localhost:5173`)
- JWT secret: obrigatório via env var `JWT_SECRET`

## Infraestrutura MVP (docker-compose, 3 serviços)
| Serviço | Porta | Resource Limits |
|---------|-------|-----------------|
| PostgreSQL 16 | 5432 | 2 CPU / 512MB |
| Backend (Spring Boot) | 8080 | 2 CPU / 1G |
| Frontend (Vite) | 3000 | 0.5 CPU / 256MB |

## Entregas Concluídas (Roadmap)
- ✅ **Q2 2026**: Design v1 + Provision v1 + Auth/RBAC + Onboarding + Docs + Observe (nativo) + Cost Platform AIOps (desmocados)
- **Q3 2026**: Observe v1 + Cost v1 (Operations)
- **Q4 2026**: AI v1 + Platform v1 (Intelligence)
- **Q1 2027**: Multi-Region + Enterprise (Scale)

## Arquitetura Hexagonal (Modulith)
Cada módulo segue: `domain/model/` (entities) → `domain/port/` (repositories) → `domain/service/` (business) → `application/dto/` (DTOs) → `infrastructure/web/` (controllers)

## Regras Imutáveis
- SEM Lombok (incompatível com JDK 25)
- SEM as any / @ts-ignore / @ts-expect-error
- UI sempre em PT-BR
- Ícones sempre lucide-react
- String (UUID v4) para chaves primárias no backend
- @NullMarked em todos os pacotes Java
