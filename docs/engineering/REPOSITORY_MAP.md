# Repository Map

> Status: Active | Owner: Engineering | Last Updated: 2026-08-14

## Overview

```
CloudBuilder/
├── backend/          # Java 21 + Spring Boot 3.4.4
├── frontend/         # React 19 + TypeScript + Vite
├── provision-engine/ # Go 1.23 + Cobra + gRPC
├── opa/              # OPA/Rego policies
├── nginx/            # Reverse proxy config
├── docs/             # Company OS documentation
├── geos/             # Growth engineering (content, SEO)
├── scripts/          # Utility scripts
├── tests/            # Cross-cutting tests
└── docker-compose.yml
```

## Backend (`backend/`)

### Structure
```
backend/src/main/java/com/cloudbuilder/
├── CloudBuilderApplication.java    # Entry point
├── iam/                            # Identity & Access
│   ├── domain/                     # User, Tenant, Role models
│   ├── application/                # DTOs
│   └── infrastructure/             # Controllers, repos
├── design/                         # Canvas
│   ├── domain/                     # CanvasDesign, CanvasNode, CanvasEdge
│   ├── application/                # DTOs
│   └── infrastructure/             # CanvasController, repos
├── provision/                      # Code generation + execution
│   ├── domain/                     # CodeGeneratorService, ProvisionService
│   ├── application/                # GeneratedCode, ProvisionResponse
│   └── infrastructure/             # CodeGeneratorController, ProvisionController
├── credential/                     # Cloud credentials
│   ├── domain/                     # Credential model, encryption
│   └── infrastructure/             # CredentialController
├── observability/                  # Metrics, logs, traces
├── aiops/                          # AI operations
├── cost/                           # Cost management
├── approval/                       # Approval gates
├── policy/                         # OPA integration
├── audit/                          # Audit logging
├── billing/                        # Billing (placeholder)
├── git/                            # Git integration
├── github/                         # GitHub OAuth
├── notification/                   # Notifications
├── shared/                         # Cross-cutting: security, encryption, events
└── ... (30 modules total)
```

### Key Files
| File | Purpose |
|------|---------|
| `pom.xml` | Maven config, dependencies |
| `application.yml` | Spring Boot configuration |
| `db/migration/V*.sql` | 40 Flyway migrations (V001–V040) |
| `**/domain/model/*.java` | JPA entities |
| `**/domain/port/*.java` | Repository interfaces |
| `**/domain/service/*.java` | Business logic |
| `**/infrastructure/web/*.java` | REST controllers |

## Frontend (`frontend/`)

### Structure
```
frontend/src/
├── main.tsx              # Entry point
├── App.tsx               # Root component
├── router/               # Route definitions
├── api/                  # API client functions
│   ├── client.ts         # HTTP client (fetch + JWT)
│   ├── design.ts         # Canvas API
│   ├── provision.ts      # Provision API
│   └── ...
├── store/                # Zustand stores (37 stores)
│   ├── canvasStore.ts    # Canvas state (942 lines)
│   ├── authStore.ts      # Auth state
│   ├── credentialStore.ts # Credentials
│   └── ...
├── modules/              # Feature modules
│   ├── canvas/           # Visual designer
│   │   ├── components/   # UI components
│   │   ├── nodes/        # CloudNode, GcpNode, etc.
│   │   ├── services/     # Terraform codegen, export
│   │   ├── validation/   # Connection rules
│   │   └── hooks/        # Canvas hooks
│   ├── provisioning/     # Provision workflows
│   ├── observability/    # Monitoring
│   ├── ai/               # AI assistant
│   ├── finops/           # Cost management
│   └── ...
├── components/ui/        # shadcn/ui components
├── types/                # TypeScript types
├── lib/                  # Utilities (cn, toast, etc.)
└── hooks/                # Shared hooks
```

### Key Files
| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts |
| `vite.config.ts` | Vite configuration |
| `tailwind.config.ts` | Tailwind + brand colors |
| `src/api/client.ts` | HTTP client with JWT |
| `src/store/canvasStore.ts` | Canvas state management |
| `src/modules/canvas/components/CanvasView.tsx` | Main canvas component |
| `src/modules/canvas/nodes/CloudNode.tsx` | Cloud resource node |

## Go Engine (`provision-engine/`)

### Structure
```
provision-engine/
├── cmd/api/main.go       # Entry point
├── internal/
│   ├── api/rest/         # HTTP handlers
│   │   ├── server.go     # Server setup
│   │   ├── provision.go  # Provision endpoints
│   │   └── deployment.go # Deployment handlers
│   ├── executor/         # Terraform execution
│   │   ├── engine.go     # Core executor
│   │   └── deployment.go # Deployment manager
│   └── domain/           # Domain models
│       ├── deployment/   # Deployment aggregates
│       └── execution/    # Execution model
├── go.mod                # Go modules
└── Dockerfile            # Multi-stage build
```

### Key Files
| File | Purpose |
|------|---------|
| `go.mod` | Dependencies |
| `cmd/api/main.go` | CLI entry point (Cobra) |
| `internal/executor/engine.go` | Terraform execution |
| `internal/api/rest/provision.go` | Provision HTTP handlers |

## OPA Policies (`opa/`)

```
opa/policies/
├── compliance/cloudbuilder/
│   └── security.rego     # Security policies
└── ...
```

## Docker (`docker-compose.yml`)

7 services:
1. **PostgreSQL** (5432) — Database
2. **Backend** (8080) — Spring Boot API
3. **Frontend** (3000) — React SPA
4. **Provision Engine** (50052) — Go execution
5. **Collab Server** (8765) — WebSocket
6. **OPA** (8181) — Policy engine
7. **Nginx** (80/443) — Reverse proxy

## Quick Reference

### New to the project?
1. Read `CLOUDBUILDER_CONTEXT.md`
2. Read `docs/architecture/SYSTEM_ARCHITECTURE.md`
3. Run `docker compose up -d`
4. Open `http://localhost:3000`
5. Login: `admin@cloudbuilder.dev` / `admin`

### Working on canvas?
- Start with `frontend/src/modules/canvas/`
- Canvas state: `frontend/src/store/canvasStore.ts`
- Node rendering: `frontend/src/modules/canvas/nodes/CloudNode.tsx`

### Working on provisioning?
- Backend: `backend/src/main/java/com/cloudbuilder/provision/`
- Go engine: `provision-engine/internal/`
- API: `frontend/src/api/provision.ts`

### Working on auth?
- Backend: `backend/src/main/java/com/cloudbuilder/iam/`
- Frontend: `frontend/src/store/authStore.ts`
- JWT: `backend/src/main/java/com/cloudbuilder/shared/security/`
