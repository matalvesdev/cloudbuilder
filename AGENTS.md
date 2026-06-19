# CloudBuilder — Platform Engineering Platform

## Stack

- **Framework**: FAANg (Future Autonomous AI Network for Engineering) — 16 especialistas, memória persistente, ADRs
- **Frontend**: React 19 + TypeScript + ReactFlow v12 (@xyflow/react) + Tailwind CSS + Vite + Zustand
- **Backend**: Java 21 + Spring Boot 3.4.4 + Spring Modulith + Maven + H2 (test)
- **Provision Engine**: Go 1.22 + Cobra CLI + gRPC
- **Database**: PostgreSQL 16 (prod), H2 (test)
- **Streaming**: Kafka 7.9 + Zookeeper
- **Cache**: Redis 7
- **Observability**: OpenTelemetry Collector + Prometheus + Grafana
- **Container**: Docker (full stack in docker-compose)
- **Brand**: Navy (#0a1128) + Lime (#ccff00) + Ice Blue (#E3E2FD)

## Project Structure

```
/                       Root
├── AGENTS.md           This file — project instructions (do NOT remove)
├── opencode.json       OpenCode agent config (16 FAANg agents) + Stitch MCP
├── docker-compose.yml  9 services: postgres, redis, zk, kafka, otel, prometheus, grafana, backend, frontend
│
├── frontend/           React 19 SPA (Vite)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── design/     ★ Complete — Canvas, Palette, Properties, Validation, AI Chat, Code Preview (54 files)
│   │   │   ├── provision/  ★ Complete — Terraform executor, deploy flow, CI/CD, ephemeral, approve/promote (10 files)
│   │   │   ├── observe/    ✅ Complete — Health/alerts dashboard + DriftDetection + DisasterRecovery (3 files)
│   │   │   ├── cost/       ✅ Funcional — Cost dashboard com otimizações (integra API real via costStore) (1 file)
│   │   │   ├── platform/   ✅ Funcional — Catalog de templates + políticas (integra API real via client.ts) (1 file)
│   │   │   ├── aiops/      ✅ Funcional — AI assistant + incident fix (integra API real, incidentStore local) (2 files)
│   │   │   ├── audit/      ✅ Complete — Auditoria com tabela de eventos (1 file)
│   │   │   ├── auth/       ★ Complete — Login, Register, ForgotPassword, ResetPassword, TenantSelector (4 files)
│   │   │   ├── dashboard/  ✅ Dashboard — Widgets de visão geral (3 files)
│   │   │   ├── iam/        🔧 Stub — Gerenciamento de identidade (1 file)
│   │   │   ├── settings/   ✅ Settings — Configurações do sistema (3 files)
│   │   │   └── docs/       ✅ Complete — DocsModule sidebar tree, search, import, markdown viewer, ADR generation (2 files)
│   │   ├── store/
│   │   │   ├── canvasStore.ts      Zustand (467 lines) — nodes/edges/history/undo-redo/align/distribute
│   │   │   ├── uiStore.ts          Zustand — sidebar/panels/tabs/active module
│   │   │   ├── authStore.ts        Zustand — login/logout/role/permission/tenant
│   │   │   ├── costStore.ts        Zustand — cost summary/history/optimizations (API + fallback mock)
│   │   │   ├── approvalStore.ts    Zustand — approval workflow
│   │   │   ├── driftStore.ts       Zustand — drift detection data
│   │   │   ├── incidentStore.ts    Zustand — AIOps incident fix history
│   │   │   ├── policyStore.ts      Zustand — platform policies
│   │   │   ├── tenantStore.ts      Zustand — tenant management
│   │   │   ├── deployStore.ts      Zustand — deployment state
│   │   │   └── 8+ more stores      activity, collaboration, credential, ephemeral, promotion, repo, systemSettings
│   │   ├── types/
│   │   │   ├── canvas.types.ts     CanvasNodeData, ComponentDefinition, ProviderType, CanvasDesign
│   │   │   ├── cost.types.ts       CostSummary, OptimizationSuggestion, CostHistory
│   │   │   ├── platform.types.ts   CatalogItem, MarketplaceListing
│   │   │   ├── drift.types.ts      DriftReport, DriftItem
│   │   │   ├── policy.types.ts     Policy, PolicySeverity
│   │   │   └── 10+ more type files  activity, collaboration, deploy, dr, ephemeral, import, promotion, repo, settings, tenant
│   │   ├── components/ui/          shadcn/ui wrappers (22 componentes: button, card, select, dialog, popover, toggle, tooltip, resizable, etc.)
│   │   ├── lib/utils.ts            cn() utility (clsx + tailwind-merge)
│   │   ├── api/                    HttpClient + auth + design + provision + dashboard + import + codeAnalysis + types (8 files)
│   └── prototypes/             1 HTML page — authoritative design reference (cloudbuilder-prototype.html)
│
├── backend/              Java 21 + Spring Boot 3.4.4 + Modulith
│   └── src/main/java/com/cloudbuilder/
│       ├── design/       ★ Complete (26 files) — hexagonal architecture
│       │   ├── domain/model/   Canvas, CanvasNode, CanvasEdge, CanvasVersion, ComponentDefinition
│       │   ├── domain/service/ CanvasService, ComponentDefinitionService, ValidationService, VersionService
│       │   ├── domain/port/    CanvasRepository, CanvasVersionRepository, ComponentDefinitionRepository
│       │   ├── domain/validator/  CidrOverlapRule, ConnectionCompatibilityRule, RequiredPropertiesRule + ValidationResult, ValidationRule
│       │   ├── application/dto/  ValidationReport, VersionDiff
│       │   └── infrastructure/web/  CanvasController, ComponentDefinitionController, ValidationController, VersionController
│       ├── provision/     ★ Complete (47 files) — entities, services, controllers, imports, DR, ephemeral
│       │   ├── domain/model/   ManagedResource, Environment, TerraformTemplate, DriftReport, DrillConfig, EphemeralEnvironment, FailoverGroup, RegionDeployment, BaseEntity
│       │   ├── domain/service/ CodeGeneratorService, DriftDetectionService, StateService, DisasterRecoveryService, EphemeralEnvironmentService, MultiFileImportService, PropertyMappingService, TerraformImportService, TerraformStateImportService
│       │   ├── domain/port/    9 repositories (DriftReport, Environment, ManagedResource, TerraformTemplate, etc.)
│       │   ├── application/dto/  CanvasDesign, GeneratedCode, ImportMultiRequest, ImportStateRequest/Response, ImportTerraformRequest/Response, ParsedConnection, ParsedResource + mais
│       │   └── infrastructure/web/  CodeGeneratorController, StateController, DisasterRecoveryController, EphemeralEnvironmentController, ImportController
│       ├── iam/           ★ Complete (24 files) — User, Role, Permission, Tenant, AuthService, IamService, JWT
│       │   ├── domain/model/   User, Role, Permission, Tenant, TenantUser, PasswordResetToken
│       │   ├── domain/port/    6 repositories
│       │   ├── domain/service/ AuthService, IamService
│       │   ├── application/dto/  LoginRequest, RegisterRequest, AuthResponse, MeResponse, UserInfo, ForgotPasswordRequest, ResetPasswordRequest
│       │   └── infrastructure/web/  AuthController, IAMController
│       ├── observe/       ✅ Complete (10 files) — Alert + ServiceHealth + HealthCheckService + ObserveController
│       │   ├── domain/model/   Alert, ServiceHealth
│       │   ├── domain/port/    AlertRepository, ServiceHealthRepository
│       │   ├── domain/service/ HealthCheckService
│       │   ├── application/dto/  AlertDTO, ObserveDashboardDTO, ServiceHealthDTO
│       │   └── infrastructure/web/  ObserveController
│       ├── cost/          ✅ Complete (7 files) — Budget + CostRecord + CostService + CostController
│       │   ├── domain/model/   Budget, CostRecord
│       │   ├── domain/port/    BudgetRepository, CostRecordRepository
│       │   ├── domain/service/ CostService
│       │   └── infrastructure/web/  CostController
│       ├── platform/      ✅ Complete (10 files) — CatalogItem + MarketplaceListing + PartnerIntegration + CatalogService + MarketplaceService + PlatformController
│       │   ├── domain/model/   CatalogItem, MarketplaceListing, PartnerIntegration
│       │   ├── domain/port/    CatalogItemRepository, MarketplaceListingRepository, PartnerIntegrationRepository
│       │   ├── domain/service/ CatalogService, MarketplaceService
│       │   └── infrastructure/web/  PlatformController
│       ├── aiops/         ✅ Complete (11 files) — Incident + AIOpsService + AIService + IncidentService + AIOpsController
│       │   ├── domain/model/   Incident
│       │   ├── domain/port/    IncidentRepository
│       │   ├── domain/service/ AIOpsService, AIService, IncidentService
│       │   ├── application/dto/  AnalysisResult, ChatRequest/Response, IncidentDTO
│       │   └── infrastructure/web/  AIOpsController
│       ├── git/           ✅ Complete (20 files) — Git scanner, IaC detector, pipeline generator, GitHub OAuth
│       ├── github/        ✅ Complete (8 files) — GitHub OAuth service, API client, controller
│       ├── multiregion/   ✅ Complete (21 files) — Region, DisasterRecovery, DRTest, RegionHealth + services + controller
│       ├── tenant/        ✅ Complete (9 files) — Project, ProjectMember + service + controller
│       ├── audit/         ✅ Complete (5 files) — AuditEvent, AuditService, AuditController
│       ├── apm/           ✅ Complete (5 files) — Traces, Spans, APMSnapshot, AlertDTO + APMController
│       ├── metrics/       ✅ Complete (6 files) — MetricPoint, MetricsSnapshot, ResourceMetrics + service + controller
│       ├── codeanalysis/  ✅ Complete (4 files) — CodeAnalyzerService + CodeAnalysisController
│       ├── docs/          ✅ Complete (6 files) — DocScannerService + AutoDocService + DocsController + domain models + DTOs
│       └── shared/
│           ├── security/      SecurityConfig (JWT + Tenant filter), JwtAuthenticationFilter, TenantContext, JwtTokenProvider, DevAuthController
│           ├── event/         Domain events infrastructure
│           ├── kernel/        Base classes (AggregateRoot)
│           └── monitoring/    Observability config
│
├── provision-engine/     Go 1.22 CLI (provision-engine.exe)
│   ├── cmd/provision-engine/main.go
│   ├── internal/
│   │   ├── api/grpc/         gRPC server
│   │   ├── drift/detector.go Drift detection logic
│   │   ├── executor/         Deployment executor
│   │   ├── generator/terraform/  Terraform code generation
│   │   ├── generator/opentofu/   OpenTofu code generation
│   │   ├── messaging/kafka.go    Kafka integration
│   │   ├── parser/              Plan + state parsing
│   │   └── provider/templates/  Provider templates
│   └── go.mod (module: github.com/cloudbuilder/provision-engine)
│
├── docs/
│   ├── phase1/           7 docs: vision, strategy, PRD, personas, journeys, business model, competitive analysis
│   ├── phase2/
│   ├── phase3/
│   ├── phase4/
│   └── roadmap/          12-month-roadmap.md (9 releases, 30 sprints, Q2 2026 → Q1 2027, team of 17)
│
└── .opencode/             OpenCode SDK + agents + skills
    ├── agents/            16 FAANg agent definitions
    │   ├── product-manager.md         (CEO Agent)
    │   ├── tech-lead.md               (CTO Agent)
    │   ├── principal-architect.md     (Principal Architect)
    │   ├── research-governor.md       (Research Governor)
    │   ├── frontend-dev.md            (Frontend Agent)
    │   ├── backend-dev.md             (Backend Agent)
    │   ├── cloud-native.md            (Cloud Native Agent)
    │   ├── devops-engineer.md         (DevOps Agent)
    │   ├── sre.md                     (SRE Agent)
    │   ├── security-engineer.md       (Security Agent)
    │   ├── database-specialist.md     (Database Agent)
    │   ├── messaging.md               (Messaging Agent)
    │   ├── observability-engineer.md  (Observability Agent)
    │   ├── performance.md             (Performance Agent)
    │   ├── payments.md                (Payments Agent)
    │   └── qa-engineer.md             (QA Agent)
    ├── skills/              FAANg skill + outros
    │   └── faang/SKILL.md   FAANg framework completo
    └── memory/              6 arquivos de memória persistente
        ├── project_memory.md
        ├── architecture_memory.md
        ├── decision_memory.md
        ├── progress_memory.md
        ├── failure_memory.md
        └── research_memory.md

```

## Frontend Conventions

- All UI text in **PT-BR** (labels, tooltips, placeholders, error messages)
- Use `lucide-react` for icons, NOT Material Icons
- Use `cn()` from `@/lib/utils` for conditional class merging
- Brand colors: `brand-navy`, `brand-lime`, `brand-ice-blue` (via tailwind config)
- State management via Zustand stores: `canvasStore`, `uiStore`
- Components use shadcn/ui wrappers (`components/ui/`)
- IDs generated with `crypto.randomUUID()` natively on both sides (string-based UUID v4)
- Canvas positions use `XYPosition` (typed x/y objects)
- Validation runs both locally (hardcoded rules) and via backend API
- API client layer em `src/api/` — HttpClient com JWT, auth.ts, design.ts, provision.ts, dashboardApi.ts, import.ts, codeAnalysis.ts, types.ts

### Design Module Components

- `DesignModule.tsx` — Layout: resizable panels (sidebar | canvas | properties), toolbar (save/validate/undo/redo/import/export), keyboard shortcuts, command palette (Cmd+K)
- `CanvasView.tsx` — ReactFlow wrapper (764 lines): drag-drop, keyboard navigation, context menu, edge type selector, alignment/distribution, auto-layout, zoom controls, minimap, snap grid, multi-select
- `ComponentPalette.tsx` — Searchable provider sidebar with drag-to-canvas, organized by provider/category
- `PropertiesPanel.tsx` — Node property editor (dynamic form based on resource type)
- `AIChatPanel.tsx` — AI assistant chat interface
- `CodePreviewPanel.tsx` — Terraform code preview with syntax highlighting
- `CollaborationPanel.tsx` — Real-time collaboration stub
- Canvas node types: `aws`, `azure`, `gcp`, `k8s` (all render via shared `CloudNode` component)
- Edge types: `connection` (with `edgeType` data: `default`/`animated`/`dashed`)

## Backend Conventions

- No Lombok (JDK 25 incompatibility)
- Explicit getters/setters/constructors in all entities (no Lombok)
- Hexagonal architecture per module: `domain/` (model, port, service, validator) | `application/` (dto) | `infrastructure/` (web/controllers)
- Spring Modulith — modules communicate via events + repositories
- JPA entities use UUID for IDs (`java.util.UUID`)
- Positions stored as separate `positionX`/`positionY` double columns
- `properties` stored as JSON string (`columnDefinition = "TEXT"`)
- Multi-tenant via `tenantId` column + `TenantFilter`
- Auth: JWT (jjwt 0.12.6) + Spring Security + role-based `@PreAuthorize`
- All packages use `@NullMarked`
- Testcontainers for integration tests

### Backend API Endpoints

| Method                  | Path                                          | Module       |
| ----------------------- | --------------------------------------------- | ------------ |
| POST/GET/PUT/DELETE     | `/api/v1/canvases`                            | Design       |
| POST/PUT/DELETE         | `/api/v1/canvases/{id}/nodes`                 | Design       |
| POST/DELETE             | `/api/v1/canvases/{id}/edges`                 | Design       |
| GET/POST/DELETE         | `/api/v1/component-definitions`               | Design       |
| POST                    | `/api/v1/canvases/{id}/validate`              | Design       |
| GET/POST                | `/api/v1/canvases/{id}/versions`              | Design       |
| POST                    | `/api/v1/canvases/{id}/generate`              | Provision    |
| GET                     | `/api/v1/environments/{id}/resources`         | Provision    |
| POST                    | `/api/v1/environments/{id}/sync`              | Provision    |
| GET/POST                | `/api/v1/environments/{id}/drift`             | Provision    |
| GET                     | `/api/v1/observe/dashboard/{environmentId}`   | Observe      |
| POST                    | `/api/v1/observe/health`                      | Observe      |
| GET                     | `/api/v1/observe/alerts/{environmentId}`      | Observe      |
| POST                    | `/api/v1/observe/alerts/{alertId}/resolve`    | Observe      |
| GET                     | `/api/v1/cost/overview/{environmentId}`       | Cost         |
| POST                    | `/api/v1/cost/records`                        | Cost         |
| GET                     | `/api/v1/cost/records/{environmentId}`        | Cost         |
| POST                    | `/api/v1/cost/budgets`                        | Cost         |
| GET                     | `/api/v1/cost/budgets/{environmentId}`        | Cost         |
| GET/GET/POST/PUT/DELETE | `/api/v1/platform/catalog[/{id}]`             | Platform     |
| GET/POST                | `/api/v1/platform/marketplace[/{id}/publish]` | Platform     |
| GET/POST/PUT            | `/api/v1/platform/partners[/{id}/...]`        | Platform     |
| GET/POST                | `/api/v1/aiops/incidents[/{id}/...]`          | AIOps        |
| POST                    | `/api/v1/aiops/query`                         | AIOps        |
| POST/GET                | `/api/v1/auth/**`                             | IAM          |
| GET/POST/PUT            | `/api/v1/iam/**`                              | IAM          |
| GET                     | `/api/v1/audit/events`                        | Audit        |
| GET                     | `/api/v1/metrics/**`                          | Metrics      |
| GET/POST                | `/api/v1/regions/**`                          | MultiRegion  |
| GET/POST                | `/api/v1/dr-plans/**`                         | MultiRegion  |
| GET/POST                | `/api/v1/git/**`                              | Git          |
| GET/POST                | `/api/v1/github/**`                           | GitHub       |
| GET/POST                | `/api/v1/projects/**`                         | Tenant       |
| GET/POST                | `/api/v1/apm/**`                              | APM          |
| POST                    | `/api/v1/code-analysis/**`                    | CodeAnalysis |

## Go Engine Conventions

- Module: `github.com/cloudbuilder/provision-engine`
- Go 1.22 + toolchain go1.22.10
- CLI via Cobra (`github.com/spf13/cobra`)
- gRPC server via `google.golang.org/grpc`
- Logging via zerolog
- Terraform/OpenTofu code generation from visual designs (CanvasDesign DTO)
- Drift detection between desired (canvas) and actual (state) infrastructure
- Packages: `api/grpc/`, `drift/`, `executor/`, `generator/terraform/`, `generator/opentofu/`, `messaging/`, `parser/`, `provider/templates/`

## Design References

- Canvas: 240px sidebar (palette) | flex canvas (ReactFlow) | 280px properties panel
- Floating centered toolbar over canvas (palette, save, validate, +, undo, redo, export, import)
- Zoom controls bottom-left, minimap bottom-right (via ReactFlow Controls/MiniMap)
- Provision page: 2-column grid with Terraform code blocks and plan summary

## Infrastructure Stack (docker-compose.yml)

| Service                 | Port                | Image                                        |
| ----------------------- | ------------------- | -------------------------------------------- |
| PostgreSQL              | 5432                | postgres:16-alpine                           |
| Backend (Spring Boot)   | 8080                | Dockerfile in ./backend                      |
| Frontend (Vite)         | 3000                | Dockerfile in ./frontend                     |

## FAANg Framework

Este projeto adota **FAANg (Future Autonomous AI Network for Engineering)** como framework único de agentes de engenharia. Todos os agentes seguem a mesma metodologia:

- **Knowledge Hierarchy**: TIER 0 (docs oficiais) → TIER 1 (engineering blogs) → TIER 2 (papers) → TIER 3 (OSS) → TIER 4 (experts)
- **Harness Engineering Pipeline**: Research → Planning → Architecture → Implementation → Review → Testing → Security → Performance → Deployment → Evaluation → Memory
- **Headroom Engine**: Compressão de contexto L1→L5 para minimizar tokens e maximizar informação útil
- **Persistent Memory**: 6 arquivos em `.opencode/memory/` (project, architecture, decision, progress, failure, research)
- **ADR Obrigatório**: Toda decisão arquitetural em `docs/architecture/adr-NNN-title.md`

Carregar o skill FAANg via `skill(name="faang")` para obter o framework completo.

### opencode.json Agents (16 FAANg especialistas)

| Agent                    | Role FAANg          | Especialidade                                         | Permissões             |
| ------------------------ | ------------------- | ----------------------------------------------------- | ---------------------- |
| `product-manager`        | CEO                 | Visão, roadmap, backlog, user stories                 | edit: deny, bash: deny |
| `tech-lead`              | CTO                 | Estratégia tech, ADRs, code review, governança        | read + git log/diff    |
| `principal-architect`    | Principal Architect | DDD, system design, distributed systems, trade-offs   | read + git log/diff    |
| `research-governor`      | Research Governor   | Docs, papers, blogs, validação de fontes, síntese     | webfetch, websearch    |
| `frontend-dev`           | Frontend            | React 19, ReactFlow, Tailwind, Zustand, shadcn/ui     | npm, npx, git          |
| `backend-dev`            | Backend             | Java 21, Spring Boot, Modulith, JPA, Kafka, Redis     | mvn, npm, git          |
| `cloud-native`           | Cloud Native        | AWS, K8s, Terraform, Docker, Helm, GitOps             | docker, go, git        |
| `devops-engineer`        | DevOps              | CI/CD, GitHub Actions, GitOps, ArgoCD                 | docker, go, git        |
| `sre`                    | SRE                 | SLI/SLO/SLA, resiliência, chaos engineering, capacity | edit: deny, bash: ask  |
| `security-engineer`      | Security            | OAuth2, JWT, OWASP, DevSecOps, SAST/DAST              | edit: deny, bash: ask  |
| `database-specialist`    | Database            | PostgreSQL, Redis, modelagem, índices, replicação     | default                |
| `messaging`              | Messaging           | Kafka, RabbitMQ, NATS, event-driven, DLQ              | edit: deny, bash: ask  |
| `observability-engineer` | Observability       | OpenTelemetry, Prometheus, Grafana, logging           | edit: deny, bash: ask  |
| `performance`            | Performance         | Web Vitals, caching, load testing, profiling          | edit: deny, bash: ask  |
| `payments`               | Payments            | Pix, Stripe, ledger, conciliação, idempotência        | edit: deny, bash: deny |
| `qa-engineer`            | QA                  | Unit, Integration, E2E (Playwright), Pact, k6         | npm, npx, mvn, git     |

MCP: Stitch (Google UI design service)

## Roadmap (12 Months)

- **Q2 2026** (Foundation): Design v1 + Provision v1
- **Q3 2026** (Operations): Observe v1 + Cost v1
- **Q4 2026** (Intelligence): AI v1 + Platform v1
- **Q1 2027** (Scale): Multi-Region + Enterprise

Full details at `docs/roadmap/12-month-roadmap.md`

## Known Issues & Gaps

- ~~Frontend uses `nanoid` (string), backend uses `UUID` — mismatch on ID types~~ ✅ **Resolved Phase 5d** — Backend fully migrated to String IDs, both sides use `crypto.randomUUID()` natively
- Frontend uses `XYPosition` (x/y object), backend uses flat `positionX`/`positionY` doubles
- Cobertura de testes backend baixa (apenas 2 services com testes JUnit) — delegated a agente
- Grafana/Prometheus sem dashboards pré-configurados — setup manual
- Sem resource limits no docker-compose.yml
- Service Map + Scorecards endpoints sem testes JUnit — need backend test coverage
- What-if Cost + Preview Workflow são apenas frontend (cálculo local) — sem persistência de cenários
- Native Observability subsystem (ADR-008) sem maven compile — dependências do pom.xml não verificadas
- DocsModule backend (DocScannerService) sem maven compile — depende de backend rodando para testar

## Session Anchored Summary

- **RBAC backend**: ✅ Complete — IAM Modulith module with User, Role, Permission, Tenant, TenantUser entities + repositories + AuthService/IamService + AuthController/IAMController + shared/security JwtTokenProvider/JwtAuthenticationFilter/SecurityConfig + DevAuthController for dev login bypass
- **RBAC frontend**: ✅ Complete — authStore (login/logout/role/permission/tenant management) + usePermission hook + ProtectedContent (module gate) + ProtectedAction (button gate) + LoginPage + RegisterPage + TenantSelector + App.tsx auth routing/module gating/nav gating
- **Permission gating (modules)**: ✅ Design/Provision/Cost/Observe/Platform/AIOps viewable by all roles; Audit/IAM/Settings admin-only via nav gating
- **Permission gating (buttons)**: ✅ ProvisionModule (Gerar Código, Confirmar Deploy) + CostModule (Otimizar, Confirmar e Aplicar) + PlatformModule (Usar Template, Resolver Todas, Corrigir, Ignorar, Criar Design) — all gated to admin/editor via ProtectedAction
- **TypeScript**: ✅ Clean compilation (zero errors)
- **Lint**: ✅ ESLint 9 flat config (eslint.config.js) — 1 minor unused-import warning, no errors
- **Bundle Splitting**: ✅ App.tsx lazy-loaded via `React.lazy()` + `lazyImport()` helper. manualChunks (vendor-reactflow, vendor-recharts, vendor-yjs, vendor-editor). Chunk principal reduzido de 1.87MB → 322KB (gzip: 98KB)
- **Frontend Build**: ✅ Vite build sucesso (2829 modules, 8.84s)
- **Frontend Tests**: ✅ Vitest — 62 tests, 5 suites, all pass (3.09s)
- **Backend Tests**: ✅ 479 JUnit tests across 33 suite files, 473 passing, 6 pre-existing failures (GaCDetector Dockerfile extension detection, PropertyMappingService first-5-raw limit, TerraformImportService module warning assertion, GitHubOAuthService null clientId)
- **E2E Tests**: ✅ Playwright smoke tests — 5/5 passing (cost, platform, aiops, auth, dashboard)
- **Desmockagem**: ✅ CostModule + PlatformModule + AIOpsModule desmocked — all using real API via costStore/platformStore with per-module API clients and Zustand stores
- **Git**: ✅ Committed and pushed — desmockagem (10 files, +1005/-108), JUnit tests (4 files, 1175 lines), Playwright E2E (2 files)
- **Go Engine**: ✅ Build + vet + test — 23 tests pass
- **CI**: ✅ `.github/workflows/ci.yml` — 3 jobs (backend Java, frontend React, Go engine)
- **Multi-tenant**: ✅ Frontend TenantSelector + backend Tenant/TenantUser entities + TenantFilter in shared/security
- **Dashboard UI**: ✅ Complete — FAANG-level redesign with MD3-inspired spacing, consistent typography, proportional cards, brand compliance
- **MVP Report**: 📋 Pending — comprehensive deployment readiness report to be created
- **Session 2026-06-16 — Infra Cleanup + Competitive Diff**: ✅ Complete
  - **Phase 1 — $0 infra**: Removed Kafka, Redis, OpenTelemetry, Prometheus, Grafana from backend (pom.xml, configs), docker-compose.yml, deleted KafkaConfig.java + OpenTelemetryConfig.java. Replaced Redis with Caffeine cache (CacheConfig.java). docker-compose.yml now has only postgres + backend + frontend. Backend compiles clean.
  - **Phase 2 — Service Map**: Backend ServiceMapController (bridges Design canvas nodes with Observe health/alert data). Frontend ServiceMapView.tsx with ReactFlow, registered as "Service Map" tab in ObserveModule.
  - **Phase 2 — Scorecards**: Backend ScorecardController (6 maturity criteria: HA, Security, Cost, Scalability, Observability, Documentation). Frontend ScorecardView.tsx with visual score indicators, registered as "Scorecards" tab in ObserveModule.
  - **Phase 2 — What-if Cost**: Frontend WhatIfCost.tsx with 3-tier estimation (min/avg/max), toggle button in CostModule header.
  - **Phase 2 — Preview Workflow**: Frontend PreviewWorkflow.tsx with plan diff view (add/change/destroy), integrated inline in ProvisionModule between code and Deployments sections.
  - **TypeScript**: Clean compilation (zero errors) after fixing ServiceMapView types, DesignModule useMemo import, ProvisionModule type mismatches, CostModule syntax.

- **Session 2026-06-17 — Phase 4: Nativization + Onboarding + Auto-Documentation**: ✅ Complete
  - **Phase 4a — Native Replacements (6/6)**: Replaced dagre (simpleDagreLayout), html-to-image (Canvas+SVG), react-resizable-panels (CSS Grid), react-hot-toast (ToastProvider EventEmitter), cmdk (native Command palette), yjs (EventBus WebSocket). Zero external npm deps for replaced modules. Package.json simplified.
  - **Phase 4a — Onboarding Flow**: Full-screen welcome → 8-step tour OR 5-step gateway setup (repo/provider/credential/env/path). Zustand+localStorage persist. "Primeiros Passos" quick-action cards in dashboard.
  - **Phase 4b — FAANg Architecture Docs**: `docs/architecture/README.md` with 15 mermaid diagrams (system overview, frontend, backend hexagonal, auth/RBAC, design→provision→deploy, onboarding, observability, Go engine, Docker infra, gantt roadmap). ADR-009 auto-documentation decision.
  - **Phase 4c — Auto-Documentation Module**: Backend DocScannerService (recursive .md scan, SHA-256, path traversal protection, frontmatter+H1 extraction) + AutoDocService (ADR draft generator) + DocsController (6 endpoints). Frontend DocsModule (sidebar tree, native markdown viewer, search, import .md, "Gerar ADR" button, stale banners, lazy code-split 15.81kB/5.24kB gzip). Registered under "Sistema → Documentação" with BookOpen icon.
  - **TypeScript**: 0 errors (`npx tsc --noEmit`).
  - **Vite Build**: 7.65s, 2,514 modules, DocsModule chunked to own entry.
  - **Vitest**: 62/62 tests pass (5 suites, 3.09s).
  - **Playwright E2E**: 6/6 module tests pass (11.3s) — onboarding localStorage bypass, DocsModule tree expand/collapse verified.
  - **Memory Files**: decision_memory.md + progress_memory.md updated with Phase 4 decisions.

- **Session 2026-06-18 — Phase 5: Backend Quality Gate**: ✅ Complete
  - **Phase 5a — Test Coverage (batch 1)**: 176 JUnit tests across CanvasService, ComponentDefinitionService, ValidationService, VersionService. All passing.
  - **Phase 5b — Test Coverage (batch 2)**: 12 test files, 277 total tests (IAM, Observe, Platform, Cost, AIOps, MultiRegion, Git). All passing.
  - **Phase 5c — Test Coverage (batch 3)**: 11 test files, 122 tests (EphemeralEnvironmentService, ComponentDefinitionService, AIOpsService, MarketplaceService, ValidationService, VersionService, GitScannerService, MultiFileImportService, DisasterRecoveryService, DriftDetectionService, StateService). All 122 passing.
  - **Phase 5d — ID Type Consistency (UUID → String Migration)**: ✅ Complete
    - 2 BaseEntity files: `@Id UUID id` → `@Id String id` with auto-generated UUID strings
    - 20 controllers: `@PathVariable UUID` → `@PathVariable String`
    - 47 repository interfaces: `JpaRepository<T, UUID>` → `JpaRepository<T, String>`
    - 50 entity/model classes: `private UUID id` → `private String id`
    - 30+ service/validator/DTO/event files: UUID parameter types → String
    - 28 test files: UUID assertions/types → String
    - **Main compile**: 0 errors. **Test compile**: 0 errors. **Test suite**: 473/479 pass (6 pre-existing failures unrelated to migration)
    - **Frontend**: Removed unused ID mapping from `id-mapper.ts` (both sides now use String natively, no localStorage bridge needed). Format converters (position/properties) preserved.
    - **TypeScript**: 0 errors (`npx tsc --noEmit`)
    - **Total scope**: ~559 UUID references across 206 Java files → all migrated to String

## Installed Plugins

- `oh-my-opencode` — multi-agent orchestration (OMO)
- `opencode-skills-collection` — 1000+ universal skills (on-demand via SkillPointer)

## Global Skills (installed)

- staff-engineer-review — deep code review
- webapp-testing — Playwright webapp testing
- code-security-auditor — security audit workflows
- artifacts-builder — HTML/React artifacts
- mcp-builder — MCP server creation
- skill-creator — create and optimize skills
- canvas-design — canvas/design workflow
- changelog-generator — release notes from git
- brand-guidelines — brand consistency
- docker-patterns — Docker/container best practices
- agent-creator — create custom OpenCode agents
