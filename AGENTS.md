# CloudBuilder — Platform Engineering Platform

## Quick Context

CloudBuilder is a visual infrastructure platform that helps platform engineers design cloud architecture visually and provision it automatically. Think: "Figma for cloud infrastructure."

**One-liner:** Design cloud infrastructure visually. Get production-ready Terraform. Deploy in minutes.

**Distribution:** Closed-source SaaS. No open-source. Content marketing + founder-led sales + free trial.

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React 19 + TypeScript + ReactFlow v12 + Tailwind CSS + Vite + Zustand | React 19 |
| **Backend** | Java 21 + Spring Boot 3.4.4 + Spring Modulith + Maven | Spring Boot 3.4.4 |
| **Provision Engine** | Go 1.23 + Cobra CLI + gRPC + segmentio/kafka-go | Go 1.23 |
| **Database** | PostgreSQL 16 (prod) + H2 (test) | PostgreSQL 16 |
| **Migrations** | Flyway (40 migrations, zero-padded V001–V040) | V001–V040 |
| **Streaming** | Apache Kafka 3.7 (KRaft mode) — optional | Kafka 3.7 |
| **Cache** | Caffeine (in-memory) | Latest |
| **Policy Engine** | OPA (Open Policy Agent) + Rego policies | OPA |
| **Auth** | JWT (jjwt 0.12.6) + Spring Security + RBAC | jjwt 0.12.6 |
| **Containers** | Docker Compose (7 services) | Docker |
| **Brand** | Navy (#0a1128) + Lime (#ccff00) + Ice Blue (#E3E2FD) | — |

## Architecture

- **Modular monolith** — 30 Spring Modulith modules, not microservices
- **Hexagonal architecture** per module: `domain/` (model, port, service, validator) | `application/` (DTOs) | `infrastructure/` (web controllers, repos)
- **Multi-tenant** via `tenantId` column + JPA `@Filter`
- **Go engine** communicates via gRPC (port 50051) and HTTP REST (port 50052)

## Frontend Conventions

- All UI text in **PT-BR** (labels, tooltips, placeholders, error messages)
- Use `lucide-react` for icons, NOT Material Icons
- Use `cn()` from `@/lib/utils` for conditional class merging
- Brand colors: `brand-navy`, `brand-lime`, `brand-ice-blue` (via tailwind config)
- State management via Zustand stores (37 stores in `frontend/src/store/`)
- Components use shadcn/ui wrappers (`components/ui/`)
- IDs generated with `crypto.randomUUID()` natively on both sides
- Validation runs both locally (hardcoded rules) and via backend API

## Backend Conventions

- No Lombok (JDK 25 incompatibility) — explicit getters/setters/constructors
- JPA entities use String for IDs (UUID strings via `crypto.randomUUID()`)
- Auth: JWT + Spring Security + role-based `@PreAuthorize`
- All packages use `@NullMarked`
- Testcontainers for integration tests

## Key Modules

### Canvas (Visual Designer)
- ReactFlow infinite canvas with drag-drop cloud resources
- Provider-specific nodes: AWS, GCP, Azure, K8s
- Property editing via schema-driven forms
- Auto-save (localStorage + backend debounced 3s)
- Connection validation with provider-aware rules
- Undo/redo, copy/paste, auto-layout

### Provisioning
- Canvas → Terraform code generation (main.tf, variables.tf, outputs.tf)
- Multi-provider: GCP, AWS, Azure, K8s
- Credential injection (GCP service accounts, AWS keys, Azure principals)
- Go engine executes: terraform init → plan → apply
- Drift detection between design and actual state

### Observability
- Metrics, logs, traces, SLOs, alerts, incidents
- Anomaly detection (statistical methods)
- Natural language querying

### FinOps
- Cost estimation per resource type
- Budget thresholds and alerts
- Cost optimization recommendations

### Security
- OPA/Rego policy engine
- Approval gates for destructive actions
- Audit logging
- RBAC with roles: OWNER, ADMIN, EDITOR, VIEWER

## Running the Project

```bash
# Full stack
docker compose up -d

# Frontend only (development)
cd frontend && npm install && npm run dev

# Backend only
cd backend && mvn spring-boot:run

# Go engine
cd provision-engine && go run ./cmd/api/main.go
```

### Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend | 8080 | http://localhost:8080 |
| Go Engine | 50052 | http://localhost:50052 |
| PostgreSQL | 5432 | localhost:5432 |
| OPA | 8181 | http://localhost:8181 |
| Nginx | 80 | http://localhost:80 |

### Default Login

```
Email: admin@cloudbuilder.dev
Password: admin
```

## Testing

```bash
# Frontend (312 tests)
cd frontend && npm test -- --run

# Backend (720+ tests)
cd backend && mvn test

# Go engine
cd provision-engine && go test ./...

# TypeScript check
cd frontend && npx tsc --noEmit
```

## CI/CD

- `.github/workflows/ci.yml` — Backend, Frontend, Go Engine
- `.github/workflows/test-pyramid.yml` — Mutation testing, E2E, visual regression
- `.github/workflows/security-scan.yml` — SAST/DAST, dependency audit

## Git Flow

- `main` — production-ready, always deployable
- `develop` — integration branch for features
- Feature branches: `feature/<name>` from `develop`
- Hotfix branches: `hotfix/<name>` from `main`

## Documentation

- `CLOUDBUILDER_CONTEXT.md` — Master context (read first)
- `docs/README.md` — Documentation index
- `docs/company/` — Strategy, thesis, culture
- `docs/product/` — Vision, requirements, activation
- `docs/architecture/` — System design, domain model
- `docs/engineering/` — Handbook, DX, testing
- `docs/security/` — Security model, auth
- `docs/ai/` — AI strategy
- `docs/business/` — Model, pricing, unit economics
- `docs/marketing/` — GTM, content, community
- `docs/roadmap/` — Roadmap, priorities
- `docs/metrics/` — North star, metrics tree

## Critical Invariants

1. **Multi-tenant isolation** — Every query must be scoped to tenantId
2. **Credential encryption** — Cloud credentials encrypted at rest with AES-256
3. **RBAC enforcement** — Every endpoint must check permissions
4. **No secrets in logs** — Never log credentials, tokens, or sensitive data
5. **Auto-save** — Canvas state must survive page refreshes
6. **Provider-aware validation** — Connection rules must match provider/resource types

## Do Not

- Remove security checks or tenant isolation
- Add secrets to code or logs
- Bypass RBAC annotations
- Run destructive migrations without backup
- Deploy to production without CI pass
- Modify Flyway migration files (add new ones instead)
- Use `ddl-auto: create` in production
- Add Lombok dependencies
