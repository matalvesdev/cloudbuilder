# CloudBuilder — Platform Engineering Platform

## Stack

- **Frontend**: React 19 + TypeScript + ReactFlow v12 (@xyflow/react) + Tailwind CSS + Vite + Zustand
- **Backend**: Java 21 + Spring Boot 3.4.4 + Spring Modulith + Maven + H2 (test)
- **Provision Engine**: Go 1.23 + Cobra CLI + gRPC + segmentio/kafka-go
- **Database**: PostgreSQL 16 (prod), H2 (test)
- **Streaming**: Apache Kafka 3.7 (KRaft mode) — optional via `cloudbuilder.kafka.enabled`
- **Cache**: Caffeine (in-memory)
- **Policy Engine**: OPA (Open Policy Agent) — Rego policies
- **Container**: Docker (full stack in docker-compose)
- **Brand**: Navy (#0a1128) + Lime (#ccff00) + Ice Blue (#E3E2FD)

## Frontend Conventions

- All UI text in **PT-BR** (labels, tooltips, placeholders, error messages)
- Use `lucide-react` for icons, NOT Material Icons
- Use `cn()` from `@/lib/utils` for conditional class merging
- Brand colors: `brand-navy`, `brand-lime`, `brand-ice-blue` (via tailwind config)
- State management via Zustand stores
- Components use shadcn/ui wrappers (`components/ui/`)
- IDs generated with `crypto.randomUUID()` natively on both sides (string-based UUID v4)
- Validation runs both locally (hardcoded rules) and via backend API

## Backend Conventions

- No Lombok (JDK 25 incompatibility)
- Explicit getters/setters/constructors in all entities (no Lombok)
- Hexagonal architecture per module: `domain/` (model, port, service, validator) | `application/` (dto) | `infrastructure/` (web/controllers)
- Spring Modulith — modules communicate via events + repositories
- JPA entities use String for IDs (UUID strings generated via `crypto.randomUUID()`)
- Multi-tenant via `tenantId` column + `TenantFilter`
- Auth: JWT (jjwt 0.12.6) + Spring Security + role-based `@PreAuthorize`
- All packages use `@NullMarked`
- Testcontainers for integration tests

## Go Engine Conventions

- Module: `github.com/cloudbuilder/provision-engine`
- Go 1.23 + toolchain go1.23.0
- CLI via Cobra (`github.com/spf13/cobra`)
- gRPC server via `google.golang.org/grpc`
- Kafka producer via `github.com/segmentio/kafka-go` (pure Go, CGO-free)
- Logging via zerolog
- Terraform/OpenTofu code generation from visual designs (CanvasDesign DTO)
- Drift detection between desired (canvas) and actual (state) infrastructure

## Infrastructure Stack (docker-compose.yml)

| Service                 | Port | Image                          |
| ----------------------- | ---- | ------------------------------ |
| PostgreSQL              | 5432 | postgres:16-alpine             |
| Backend (Spring Boot)   | 8080 | Dockerfile in ./backend        |
| Frontend (Vite)         | 3000 | Dockerfile in ./frontend       |

## Git Flow

- `main` — production-ready, always deployable
- `develop` — integration branch for features
- Feature branches: `feature/<name>` from `develop`
- Hotfix branches: `hotfix/<name>` from `main`
- All PRs require CI pass before merge

## CI/CD

- `.github/workflows/ci.yml` — Backend (Java), Frontend (React), Go Engine
- `.github/workflows/test-pyramid.yml` — Mutation testing, E2E, visual regression
- `.github/workflows/security-scan.yml` — SAST/DAST, dependency audit

## Roadmap

- **Q2 2026** (Foundation): Design v1 + Provision v1
- **Q3 2026** (Operations): Observe v1 + Cost v1
- **Q4 2026** (Intelligence): AI v1 + Platform v1
- **Q1 2027** (Scale): Multi-Region + Enterprise

Full details at `docs/roadmap/12-month-roadmap.md`

## Known Issues

- Frontend uses `XYPosition` (x/y object), backend uses flat `positionX`/`positionY` doubles
- Service Map + Scorecards endpoints sem testes JUnit
- What-if Cost + Preview Workflow são apenas frontend (cálculo local)
