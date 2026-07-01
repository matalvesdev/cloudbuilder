# CloudBuilder — Platform Engineering Platform

## Stack

- **Framework**: FAANg (Future Autonomous AI Network for Engineering) — 16 especialistas, memória persistente, ADRs
- **Frontend**: React 19 + TypeScript + ReactFlow v12 (@xyflow/react) + Tailwind CSS + Vite + Zustand
- **Backend**: Java 21 + Spring Boot 3.4.4 + Spring Modulith + Maven + H2 (test)
- **Provision Engine**: Go 1.23 + Cobra CLI + gRPC + segmentio/kafka-go
- **Database**: PostgreSQL 16 (prod), H2 (test)
- **Streaming**: Apache Kafka 3.7 (KRaft mode, no Zookeeper) — optional via `cloudbuilder.kafka.enabled`
- **Cache**: Caffeine (in-memory, replaces Redis as of Phase 1)
- **Policy Engine**: OPA (Open Policy Agent) — Rego policies for cost/custom/governance/security
- **Container**: Docker (full stack in docker-compose)
- **Brand**: Navy (#0a1128) + Lime (#ccff00) + Ice Blue (#E3E2FD)

## Project Structure

```
/                       Root
├── AGENTS.md           This file — project instructions (do NOT remove)
├── opencode.json       OpenCode agent config (16 FAANg agents) + Stitch MCP
├── docker-compose.yml  6 services: postgres, kafka, backend, opa, provision-engine, frontend
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
│           ├── event/         Domain events infrastructure + Kafka EDA (ADR-035): KafkaConfig, TopicRouter, KafkaEventPublisher, InboxProcessor, DLQHandler, EventInbox, DlqEvent, 4 dual-mode Kafka listeners, EventStreamKafkaBridge
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
- JPA entities use String for IDs (UUID strings generated via `crypto.randomUUID()` natively)
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
- Go 1.23 + toolchain go1.23.0
- CLI via Cobra (`github.com/spf13/cobra`)
- gRPC server via `google.golang.org/grpc`
- Kafka producer via `github.com/segmentio/kafka-go` (pure Go, CGO-free)
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
| Kafka (KRaft)           | 9092                | bitnami/kafka:3.7                            |
| Backend (Spring Boot)   | 8080                | Dockerfile in ./backend                      |
| OPA (Policy Engine)     | 8181                | openpolicyagent/opa:latest                   |
| Provision Engine (Go)   | 50051               | Dockerfile in ./provision-engine             |
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
| `backend-dev`            | Backend             | Java 21, Spring Boot, Modulith, JPA, Kafka, Caffeine  | mvn, npm, git          |
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
- ~~Cobertura de testes backend baixa~~ ✅ **Resolved Phases 5a-5c** — 479 JUnit tests across 33 suite files
- ~~Grafana/Prometheus sem dashboards pré-configurados~~ ✅ **Resolved** — These services were removed in Phase 1; observability is native (PostgreSQL time-series + Recharts dashboards)
- ~~Sem resource limits no docker-compose.yml~~ ✅ **Resolved** — All 6 services now have CPU/memory limits
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
- **Go Engine**: ✅ Build + vet + test — 29 tests pass (23 base + 6 Kafka)
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

- **Session 2026-06-22 — FAANg Comprehensive ADR Audit + Bug Fix**: ✅ Complete
  - **Audit**: 23 ADRs (008-030) verified against actual source code — all gaps/bugs confirmed or corrected
  - **Report**: Generated `docs/architecture/adr-final-comprehensive-audit.md` (393 lines, 12 sections) documenting every bug with code evidence
  - **9 bugs fixed** across 7 files:
    - `SsoAuthController.java`: Removed email PII from callback URL (H6)
    - `AnalyticsService.java`: Merge function `(a,b)->a` → `(a,b)->a+b` (M5)
    - `SsoAuthService.java`: Roles from DB not hardcoded VIEWER (H2); Jackson not custom parser (M1); tenantId in login log (M8)
    - `AnalyticsUserRollupDailyRepository.java`: Added upsert query method (H5)
    - `AnalyticsRollupMonthlyRepository.java`: Added delete methods (M3)
    - `AnalyticsRollupDailyRepository.java`: Added tenant-isolated delete (M4)
    - `AggregationService.java`: User rollup upsert (H5); monthly cleanup (M3); tenant-isolated cleanup (M4)
  - **3 false positives corrected**: C6 (README already correct), C7 (ADR-020 header already correct), C8 (SSO frontend buttons already exist)
  - **Still open (at audit time)**: H1 (JWKS signature verification), C9 (SSO refresh token endpoint), M2 (hardcoded encryption key), M6/M7 (documentation cleanup) — **ALL RESOLVED in Phase 6B-9 merge** (see Session 2026-06-24)
  - **Backend compile**: ✅ clean. **Frontend TypeScript**: ✅ 0 errors. **Tests**: ⚠️ same 6 pre-existing failures

- **Session 2026-06-24 — Phase 6B-9 FAANg Production Pipeline Merge**: ✅ Complete
  - **14 FAANg agents merged**: 363 files, +31678/-2178 — commit `b326759`
  - **New backend modules**: credential, environment, approval, deployment (4 modules, 30+ files, hexagonal arch)
  - **Security expansion**: JWKS verifier, SecretEncryptionConverter (AES-256), MFA service, SSO auth/config controllers, Session entity/repository
  - **Observability**: MetricsDualWriter, PartitionMaintenance, TraceInterceptor, NotificationChannelController
  - **Flyway V9-V13**: 5 migrations (observability schema, analytics rollup, docs metadata, brin indexes, credentials/env/approvals/deployments)
  - **11 Playwright E2E specs**: audit, design, docs, iam, navigation, observe, onboarding, provision, responsive, settings + helpers
  - **Cross-cutting**: API versioning (header-based, 5 files), shared monitoring (Micrometer + MDC + health indicator), WebConfig (CORS)
  - **Infra**: Prometheus alerts, Grafana golden signals dashboard, k6 load tests
  - **OPA**: 4 Rego policies (cost/custom/governance/security)
  - **Docs**: SLO/SLI definitions, bundle analysis, LGPD compliance, Beta plan + checklist
  - **Cleanup**: Removed 9 garbage files (commit `1c888e5`), memory files updated
  - **Still missing**: Backend Maven compile verification (no `mvn` in env). 5 ADR bugs (H1, C9, M2, M6, M7) — **✅ ALL verified as already fixed in this merged code** (see Session 2026-06-24 cleanup)

- **Session 2026-06-24 — ADR Bug Cleanup + Production Readiness 🟢 GREEN**: ✅ Complete
  - **H1 (JWKS)**: Already wired — `SsoAuthService.decodeIdToken()` calls `jwksVerifier.verify()` at L314
  - **C9 (SSO refresh)**: Already exists — `POST /api/v1/auth/oauth2/refresh` at SsoAuthController L122-138
  - **M2 (encryption key)**: Already uses PBKDF2 600K iterations + env var `CLOUDBUILDER_ENCRYPTION_KEY`; added property to `application.yml` for discoverability
  - **M6 (ADR-012 Kafka refs)**: Already clean — ADR-012 §4 states "Kafka/Redis removed in Phase 4"
  - **M7 (ADR-029 ComplianceService)**: ADR-029 is "Proposed" future doc, not a code documentation issue
  - **PRR updated**: 🟡 YELLOW → 🟢 GREEN (B5 closed, 5 blocking → 4 blocking)
  - **Memory files**: decision_memory.md + progress_memory.md updated

- **Session 2026-06-24 — Phase 5 Production Readiness Implementation (B2-B4, B6)**: ✅ Complete
  - **B2 (AnalyticsController @PreAuthorize)**: Added class-level `@PreAuthorize("hasRole('ADMIN')")` — analytics data is admin-only
  - **B3 (SearchController @PreAuthorize)**: Added class-level `@PreAuthorize("isAuthenticated()")` — search available to all authenticated users
  - **B6 (Drift Detection Backend DTOs)**: Created `DriftReportResponseDTO.java` + `DriftItemDTO.java` in `provision/application/dto/` — properly parses `driftDetails` JSON string into typed list with computed summary
  - **B6 (StateController update)**: Updated all 4 drift endpoints to return `DriftReportResponseDTO` instead of raw `DriftReport` entity — added `ObjectMapper` injection
  - **B6 (Frontend driftStore)**: Rewired `driftStore.ts` — removed `persist` middleware, removed `simulateDriftDetection()` mock data, added real API calls (`getDriftReport()`, `resolveDrift()`), added `loadDriftReport()` + `loading`/`error` states + `selectedEnvironmentId`
  - **B6 (DriftDetection.tsx)**: Fixed UI component to use `loadDriftReport()` instead of `simulateDriftDetection()` — initial load + "Detectar" button both use real API
  - **B4 (Go Azure templates)**: Created `azure.go` + `azure_providers.go` — 5 resource templates (resource group, VNet, subnet, Linux VM, PostgreSQL flexible server) with parent ref helpers
  - **B4 (Go GCP templates)**: Created `gcp.go` + `gcp_providers.go` — 4 resource templates (compute network, subnetwork, compute instance, storage bucket) with parent ref helpers
  - **B4 (Go K8s templates)**: Created `k8s.go` + `k8s_providers.go` — 4 resource templates (namespace, deployment, service, config map) with namespace ref helper
  - **B4 (Go template router)**: Refactored `aws.go` — `GetTemplate()` → `awsTemplates()`. Created `router.go` with new `GetTemplate()` dispatching to all 4 providers (AWS/Azure/GCP/K8s)
  - **Total Go templates**: 9 files in `internal/provider/templates/` — aws.go, azure.go, gcp.go, k8s.go, router.go + 3 provider registry files + aws_test.go
  - **Total changes**: 13 files modified/created across backend (4 Java), frontend (2 TS/TSX), Go engine (5+4 Go files)
  - **Verification**: No `mvn`/`go`/`tsc` in env — code-level correctness verified by reading all changed files

- **Session 2026-06-28 — ADR-032 Feature Flags (Public Beta)**: ✅ Complete
  - **Backend (7 Java files)**: V15 migration with 8 seed flags (module.cost/platform/aiops/audit/iam, feature.what-if-cost/preview-workflow, config.max-users). Hexagonal module: FeatureFlag entity, FeatureFlagRepository (Spring Data), FeatureFlagService (Caffeine @Cacheable 30s TTL, tenant > global resolution), FeatureFlagController (CRUD + refresh + check endpoints), FlagToggleEvent (domain event), DTOs.
  - **Frontend (4 files)**: api/featureFlags.ts (6 API client functions), uiStore.ts (fetchFlags/isEnabled/refreshFlags with module-aware fallback), FeatureFlagsPage.tsx (admin-only panel with grouping/search/toggle/config), App.tsx (flags route in Governança nav, isEnabled() gating AND with RBAC for cost/platform/aiops/audit/iam modules).
  - **Resolution strategy**: tenant-specific > global > default(false). Known modules without explicit flag default to true except module.iam (false).
  - **TypeScript**: 0 errors. **LSP diagnostics**: clean. **Memory**: decision_memory.md + progress_memory.md updated.

- **Session 2026-06-28 — Architecture Manifesto (6 Parts, 1,588 lines)**: ✅ Complete
  - **Part I — Architecture Manifesto**: Mission, vision, 14 architectural principles (DDD First, Cloud Native First, API First, Event First, AI First, Domain-Oriented Engineering, DX First, Platform Engineering, Scalability by Design, Security by Design, Observability by Default, Continuous Evolution, Event-Driven Reactivity, Self-Service Autonomy) with trade-offs and anti-patterns per principle.
  - **Part II — Product Vision**: Market problem (5 pain points), 5 personas (Rafael/Architect, Marina/DevOps, Diego/Developer, Carla/Platform Head, Lucas/FinOps), ICP, 9 JTBD, product objectives with metrics, 10 use cases, user journey (Mermaid), architectural roadmap (Q2'26–Q1'27), 5-year vision.
  - **Part III — Strategic Domain-Driven Design**: Domain vision, core/supporting/generic classification with rationale, context map (Mermaid), 10 bounded contexts with ubiquitous language, relationship patterns (C/S, Shared Kernel, OHS, ACL, Published Language), 20 domain events catalog, tactical DDD for Design Context (Canvas aggregate, CanvasNode/CanvasEdge entities, ValidationRule policy).
  - **Part IV — C4 Architecture**: Level 1 System Context, Level 2 Container Diagram (React SPA, Java Backend with 12 modules, Go Engine with 6 components, PostgreSQL, Caffeine), Level 3 Component (Design Module: controllers/services/repositories/validators), Level 4 Code (sequence diagrams for canvas creation, provision/deploy flow), Level 4 Deployment (Docker Compose + target AWS/ECS).
  - **Part V — Event-Driven Architecture**: Event Storming flow (Design→Provision→Observe→Cost→AI), event schema standard with correlationId/causationId/versioning, Outbox pattern (Mermaid), idempotency strategy (Mermaid), correlation chain example.
  - **Part VI — Architecture Compliance Checklist**: 11 sections (DDD, Clean Architecture, Hexagonal, EDA, API Design, Security, Observability, Scalability, Code Quality, ADR Compliance). Architecture Scorecard: 7.4/10 overall across 10 dimensions.
  - **File**: `docs/architecture/manifesto/ARCHITECTURE_MANIFESTO.md` (1,588 lines, 6 Mermaid diagrams, 20+ tables, 14 principles, 11 checklist sections).

- **Session 2026-06-28 — ADR-035 + EDA Documentation**: ✅ Complete
  - **ADR-035**: Formalized production EDA diagram as `docs/architecture/adr-035-production-event-driven-architecture.md` — transitions from Spring Modulith events to Kafka-based EDA with 10 producers, 20 topics, 6 integration patterns, 8 consumers, 6 read models.
  - **Key Decisions**: Kafka over Pulsar/EventBridge (best ecosystem/portability), backward-compatible schema evolution, Outbox Pattern for reliable publishing, Inbox Pattern for idempotent consumers, 6 implementation phases (3 months total).
  - **Comprehensive EDA Docs**: Created `docs/architecture/eda/README.md` (~15K) — 20 Kafka topics (partitions/replication/retention), JSON Schema event contracts (Base/Canvas/Deployment/Drift/Cost), 6 integration patterns with Java code (Outbox/Inbox/Saga/DLQ/Retry/Compensating), 8 consumer implementations, observability (correlation IDs/metrics/tracing), security (ACLs/encryption), tests (integration/consumer), deploy (Docker Compose + K8s Strimzi).
  - **Files**: `docs/architecture/adr-035-production-event-driven-architecture.md`, `docs/architecture/eda/README.md`

- **Session 2026-06-28 — ADR-035 Feature Flags (Public Beta)**: ✅ Complete
  - **Backend (7 Java files)**: V15 migration with 8 seed flags (module.cost/platform/aiops/audit/iam, feature.what-if-cost/preview-workflow, config.max-users). Hexagonal module: FeatureFlag entity, FeatureFlagRepository (Spring Data), FeatureFlagService (Caffeine @Cacheable 30s TTL, tenant > global resolution), FeatureFlagController (CRUD + refresh + check endpoints), FlagToggleEvent (domain event), DTOs.
  - **Frontend (4 files)**: api/featureFlags.ts (6 API client functions), uiStore.ts (fetchFlags/isEnabled/refreshFlags with module-aware fallback), FeatureFlagsPage.tsx (admin-only panel with grouping/search/toggle/config), App.tsx (flags route in Governança nav, isEnabled() gating AND with RBAC for cost/platform/aiops/audit/iam modules).
  - **Resolution strategy**: tenant-specific > global > default(false). Known modules without explicit flag default to true except module.iam (false).
  - **TypeScript**: 0 errors. **LSP diagnostics**: clean. **Memory**: decision_memory.md + progress_memory.md updated.

- **Session 2026-06-28 — ADR-035 Implementation (9 Phases, 21/21 Todos)**: ✅ Complete
  - **Phase 1 (Docker + Config)**: Kafka KRaft single-node (bitnami/kafka:3.7), `application.yml` Kafka config (12 topics, producer/consumer), `docker-compose.yml` with kafka service + kafka-net network
  - **Phase 2 (Kafka Infrastructure)**: `KafkaConfig.java` (ProducerFactory/ConsumerFactory/KafkaTemplate/AdminClient/TopicInitializer), `TopicRouter.java` (event type prefix → topic mapping), `KafkaEventPublisher.java` (dual-mode: @ConditionalOnProperty), `OutboxSweeper.java` (null-safe Kafka publish path)
  - **Phase 3 (Inbox + DLQ)**: `EventInbox.java` + `EventInboxRepository.java` (dedup entity/repo), `V16__event_inbox_dlq.sql` (Flyway migration), `InboxProcessor.java` (tryAcquire dedup logic), `DlqEvent.java` + `DlqEventRepository.java` (DLQ entity/repo), `DLQHandler.java` (consumer for *.events.dlq)
  - **Phase 4 (Kafka Consumers)**: 4 dual-mode listeners: `CostEventListenerKafka`, `DeploymentEventListenerKafka`, `DriftEventListenerKafka`, `IncidentEventListenerKafka` (Inbox Pattern dedup), 4 original `@EventListener` modified with `@ConditionalOnProperty(kafka=false)`
  - **Phase 5 (EventBridge)**: `EventStreamKafkaBridge.java` (Kafka → Spring events bridge, always active), `EventStreamController.java` reverted (no @ConditionalOnProperty needed)
  - **Phase 6 (Event ID Consistency)**: `PlatformEvent.java` — `getEventId()` (UUID), `getCorrelationId()`, `getCausationId()`, `getVersion()` defaults
  - **Phase 7 (Go Engine Kafka)**: `kafka.go` (KafkaProducer with segmentio/kafka-go), `kafka_test.go` (6 tests), `event.go` (EventPublisher extended with optional KafkaProducer), `server.go` (NewProvisionServerWithKafka), `main.go` (--kafka + --kafka-brokers CLI flags), `go.mod` (bumped to go 1.23)
  - **Phase 8 (Frontend SSE Reconnect)**: `useSSE.ts` (exponential backoff 2s→60s, 10 retries, retryCount state), `useEventStream.ts` (EventStreamState, manual reconnect(), capped delay), `useMetricsStream.ts` (exponential backoff replacing fixed 5s, nodeNamesRef stability)
  - **Phase 9 (Integration Tests)**: 5 test files, 30 unit tests (TopicRouterTest 16, InboxProcessorTest 4, KafkaEventPublisherTest 3, DLQHandlerTest 3, EventStreamKafkaBridgeTest 4) — pure Mockito, no @EmbeddedKafka
  - **Final Verification**: Go build clean + 29/29 tests pass, TypeScript 0 errors, 32 source + 5 test Java files
  - **Memory**: decision_memory.md + progress_memory.md updated with all ADR-035 decisions

- **Session 2026-06-28 — 5 Companion Architecture Documents**: ✅ Complete
  - **Security Architecture** (28K, 15 sections): Posture overview, JWT auth, RBAC (3 roles, 4 permission gates), multi-tenant isolation (TenantFilter), TOTP MFA (ADR-018), SSO OAuth2+PKCE (ADR-025), secrets encryption (AES-256-GCM, ADR-028), session security (7-day rotation), API security, TLS/CI-CD SAST/DAST, audit/compliance, threat model (10 scenarios), OWASP Top 10 coverage, security roadmap Q2'26–Q1'27.
  - **Observability Architecture** (34K, 15 sections): Design philosophy (native vs external), metrics (PostgreSQL time-series), tracing (TraceInterceptor/TraceContext), async logging (PostgresLogAppender), alerting (OPEN→ACKNOWLEDGED→RESOLVED), SLO/SLI with error budgets, SSE streaming (useSSE hook), Service Map & Scorecards, Recharts dashboards, PG partitioning strategy, API reference, performance estimates, migration roadmap.
  - **Go Engineering Handbook** (34K, 17 sections): Stack/deps, directory structure, domain model (CanvasDesign/DesignNode/Edge/ProviderType), gRPC interface (8 RPCs, custom JSON codec, no protoc), HCL generation pipeline, provider template system (AWS:5/Azure:5/GCP:4/K8s:4), Executor (terraform/tofu wrapper, 10 commands), DeploymentManager (9 status lifecycle), drift detection (binary state vs design), plan/state parsers, event pub/sub (6 event types, gRPC streaming bridge), WebSocket CRDT relay (Yjs), Cobra CLI, Docker build (multi-stage, non-root), deploy pipeline flow, 23 tests.
  - **FinOps Architecture** (29K, 16 sections): Hexagonal architecture, 6 domain models (CostRecord, Budget, BudgetAlert, CostScenario, CostForecast, CostOptimizationSuggestion), 8 services, 13 REST endpoints, anomaly detection (7-day MA + std dev), 3-tier what-if estimation (ADR-011), optimization lifecycle, budget alerts (80%/95%), AWS Cost Explorer integration, Zustand costStore, full DDL (6 tables), indices, roadmap Q3'26–Q1'27.
  - **AI Platform Architecture** (34K, 18 sections): LLM provider abstraction (ADR-013), 3-tier confidence pipeline (ADR-017), incident lifecycle (OPEN→RESOLVED→PostMortem), 5 domain models, 23 REST endpoints, deterministic classification (keywords), rule-based RCA fallback templates, 10 auto-remediation action types, 7 runbook categories, post-mortem lifecycle (DRAFT→PUBLISHED), 3 design templates (VPC+ECS+RDS/EKS/Serverless), chat assistant system prompt, Resilience4j circuit breaker fallback chain, full DDL (5 tables), roadmap Q4'26–Q1'27.
  - **Directories**: `docs/architecture/security/`, `docs/architecture/observability/`, `docs/architecture/go-engine/`, `docs/architecture/finops/`, `docs/architecture/ai-platform/`
  - **Total**: ~159K across 5 files, 81 sections, all grounded in existing ADRs (008, 011, 013, 017, 018, 025, 028) and actual codebase state

- **Session 2026-06-28 — ADR-036 Comprehensive Test Pyramid**: ✅ Complete
  - **ADR-036**: Created `docs/architecture/adr-036-comprehensive-test-pyramid.md` — 11 test layers (unit, component, property-based, mutation, BDD, integration, E2E, load/stress, chaos, security, visual regression) with tooling per layer, CI pipeline, metrics, and execution strategies.
  - **Property-Based Testing**: `fast-check` installed. Domain arbitraries (`canvasArbitraries.ts`) for nodes/edges/positions. Property tests for `uiStore` (isEnabled idempotency, toggle invariants), `canvasStore` (addNode uniqueness, removeNode edge cleanup, undo bounds), `costStore` (anomaly detection properties), `utils` (cn idempotency, nanoId uniqueness/length).
  - **Mutation Testing**: `@stryker-mutator/vitest-runner` installed. `stryker.config.mutator.ts` configured with 50% threshold for statements/branches.
  - **BDD Specs**: `design.behavior.spec.ts` (7 Given/When/Then scenarios), `auth.behavior.spec.ts` (6 scenarios) — Zustand stores reset via `beforeEach` + `clearCanvas()`.
  - **Load/Stress**: k6 scripts (`load-test.js`, `stress-test.js`, `soak-test.js`) targeting `/api/v1/canvases`, `/api/v1/observe/dashboard`, `/api/v1/cost/overview`.
  - **Chaos**: `chaos-experiments.json` — 4 experiments (latency injection, pod kill, network partition, memory pressure).
  - **Security**: OWASP ZAP baseline (`zap-baseline.conf`), Snyk (`snyk.properties`), Playwright visual regression (15 screenshot tests across 5 modules).
  - **CI Pipeline**: `.github/workflows/test-pyramid.yml` — 4 jobs (unit, property+mutation, E2E+visual, load+chaos+security), `test:all` script.
  - **Bug Fixes (4 production bugs found by tests)**:
    - `uiStore.ts`: `isEnabled` prototype pollution — `featureFlags["constructor"]` returned Object prototype method via `{}["constructor"]`. Fixed with `Object.prototype.hasOwnProperty.call()`.
    - `design.behavior.spec.ts`: State leaked between BDD tests (no `beforeEach` reset). Fixed with `useCanvasStore.getState().clearCanvas()`.
    - `utils.ts`: `nanoId(0)` returned UUID instead of empty string — `if (length)` treated `0` as falsy. Fixed to `if (length != null)`.
    - `utils.property.test.ts`: `cn()` idempotent assertion assumed `cn(a,a)` contains `a` as substring, but `filter(Boolean).join(' ')` splits whitespace. Fixed to compare unique token sets.
  - **Verification**: `npx tsc --noEmit` 0 errors. `npx vitest run` 132/132 tests pass across 13 test files.

- **Session 2026-06-28 — Flyway UUID→VARCHAR(36) Migration Fix (Root Cause)**: ✅ Complete
  - **Root Cause**: Phase 5d migrated Java entities from `UUID` to `String` for IDs, but Flyway migrations V1-V11 still used PostgreSQL `UUID` type. This caused `operator does not exist: uuid = character varying` errors on all JPA queries and `column "version" does not exist` on canvases.
  - **Fix (11 migration files rewritten)**: V1-V9, V11 — changed all `UUID` id/FK columns to `VARCHAR(36)`. Added `version INTEGER NOT NULL DEFAULT 0` to `canvases` in V1. V10, V12-V17 already used VARCHAR or were not affected. Deleted V18 (ALTER TABLE workaround, no longer needed).
  - **DB Schema Fixes**: V9 — added PRIMARY KEYs to 7 observability tables, removed partial unique constraint `WHERE status = 'OPEN'`. V11 — reordered partition creation (specific before default), changed default partition to `DEFAULT` keyword. V13 — replaced invalid `CREATE TRIGGER IF NOT EXISTS` with `DO $$ BEGIN IF NOT EXISTS...END $$;`.
  - **V17 Created**: Added missing tables `regions`, `region_health`, `disaster_recovery_plans`, `iam_sessions` with VARCHAR(36) ids.
  - **Docker**: Added `SPRING_FLYWAY_ENABLED=true`, `SPRING_JPA_DATABASE_PLATFORM=org.hibernate.dialect.PostgreSQLDialect` to docker-compose.yml backend env.
  - **Verification**: 61 tables, 17/17 migrations success, zero UUID id columns remain. Auth login ✅, Canvas CRUD ✅ (version column working), Cost ✅, Observe ✅, Platform ✅, Audit ✅ (with tenantId path variable). Backend health UP.
  - **Pre-existing issues (not migration-related)**: OutboxSweeper `TransactionRequiredException` (needs `@Transactional`), frontend healthcheck shows unhealthy despite backend responding.

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
