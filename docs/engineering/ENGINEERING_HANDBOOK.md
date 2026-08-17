# Engineering Handbook

> Status: Active | Owner: Engineering | Last Updated: 2026-08-14

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + TypeScript + Vite | React 19, Vite latest |
| State | Zustand | 5.x |
| UI | Tailwind CSS + shadcn/ui + Radix | Latest |
| Canvas | ReactFlow | v12 |
| Icons | lucide-react | Latest |
| Backend | Java + Spring Boot | Java 21, Spring Boot 3.4.4 |
| Architecture | Spring Modulith | 1.3.4 |
| Database | PostgreSQL | 16 (prod), H2 (test) |
| Migrations | Flyway | 40 migrations, zero-padded |
| Auth | JWT + Spring Security | jjwt 0.12.6 |
| Go Engine | Go + Cobra + gRPC | Go 1.23 |
| Kafka | segmentio/kafka-go | Latest |
| Policy | OPA | Latest |
| CI/CD | GitHub Actions | Latest |
| Containers | Docker Compose | Latest |

## Git Flow

```
main — production-ready, always deployable
  └── develop — integration branch
       └── feature/<name> — feature branches
       └── hotfix/<name> — emergency fixes
```

### Branch Naming

- `feature/provision-status-dashboard`
- `fix/canvas-delete-persistence`
- `docs/architecture-documentation`
- `chore/dependency-update`

### Commits

```
type(scope): description

feat(canvas): add template library
fix(provision): correct boot_disk image path
docs(architecture): add system architecture
chore(deps): update React to 19.1.0
test(backend): add ProvisionController tests
```

Types: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`, `perf`, `ci`

### PRs

- Title: descriptive, linked to issue
- Description: what changed and why
- Tests: must pass CI
- Review: at least 1 approval for main/develop
- Squash merge to develop, merge commit to main

## Code Conventions

### Frontend (TypeScript/React)

- Functional components only (no class components)
- Hooks for state and side effects
- Zustand stores for global state
- `cn()` from `@/lib/utils` for conditional classes
- lucide-react for icons (NOT Material Icons)
- shadcn/ui components in `components/ui/`
- All UI text in PT-BR
- Crypto.randomUUID() for ID generation

### Backend (Java/Spring)

- No Lombok (JDK 25 incompatibility)
- Explicit getters/setters/constructors
- Hexagonal architecture per module:
  - `domain/` — model, port, service, validator
  - `application/` — DTOs
  - `infrastructure/` — web controllers, repositories
- Spring Modulith — modules communicate via events + repositories
- JPA entities use String for IDs (UUID strings)
- Multi-tenant via `tenantId` column + `TenantFilter`
- `@NullMarked` on all packages
- Jakarta Bean Validation for input

### Go Engine

- Go 1.23 conventions
- Cobra for CLI
- gRPC for inter-service communication
- zerolog for logging
- Interface-based design

## Testing

### Test Pyramid

```
        E2E (Playwright)
       ────────────────
      Integration (JUnit + Testcontainers)
     ──────────────────────────────
    Unit (JUnit + Vitest)
   ──────────────────────────────────
  Static Analysis (ESLint + Java compiler)
```

### Frontend Tests

```bash
npm test                    # Run all tests
npm test -- --run           # Single run
npm test -- --watch         # Watch mode
npm test -- --run src/path  # Specific file
```

- Framework: Vitest + React Testing Library
- Current: 312 tests passing
- Convention: `*.test.tsx` for component tests, `*.property.test.ts` for property tests

### Backend Tests

```bash
mvn test                    # Run all tests
mvn test -Dtest=ClassName   # Specific test class
mvn test -pl . -q           # Quiet mode
```

- Framework: JUnit 5 + Mockito + MockMvc
- Integration: Testcontainers for PostgreSQL
- Current: 720+ tests passing
- Convention: `*Test.java` for unit, `*IT.java` for integration

### Go Tests

```bash
go test ./...               # Run all tests
go test ./internal/...      # Specific package
go build ./...              # Verify build
```

- Framework: Go standard testing
- Current: All tests passing

## CI/CD

### GitHub Actions Workflows

| Workflow | Trigger | What it does |
|----------|---------|-------------|
| `ci.yml` | Push to main/develop | Backend (Java), Frontend (React), Go Engine |
| `test-pyramid.yml` | PR | Mutation testing, E2E, visual regression |
| `security-scan.yml` | Push to main | SAST/DAST, dependency audit |
| `deploy-pages.yml` | Push to main | Deploy docs to GitHub Pages |
| `docker-publish.yml` | Tag | Build and push Docker images |

### CI Pipeline

```
Lint → Typecheck → Unit Tests → Integration Tests → Build → Security Scan → Deploy
```

## Local Development

### Prerequisites

- Java 21+
- Node.js 18+
- Go 1.23+
- Docker + Docker Compose
- PostgreSQL 16 (or use Docker)

### Quick Start

```bash
# Clone and start
git clone https://github.com/matalvesdev/cloudbuilder.git
cd cloudbuilder
docker compose up -d

# Frontend (development)
cd frontend && npm install && npm run dev

# Backend (development)
cd backend && mvn spring-boot:run

# Go Engine
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

## Code Review

### Checklist

- [ ] Tests pass (CI green)
- [ ] No TypeScript/compilation errors
- [ ] New code has tests
- [ ] Security considerations addressed
- [ ] No secrets in code
- [ ] Multi-tenant isolation maintained
- [ ] Error handling is user-friendly
- [ ] Performance impact assessed
- [ ] Documentation updated if needed

### Principles

- Review for correctness, not style (let linter handle style)
- Ask questions, don't make demands
- Suggest alternatives, don't block
- Approve when concerns are addressed, not when perfect

## Definition of Done

- [ ] Feature works as specified
- [ ] Tests written and passing
- [ ] No regressions (existing tests pass)
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Verified in staging
- [ ] No security vulnerabilities introduced
