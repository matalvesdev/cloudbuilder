# CloudBuilder — Engenharia

## Stack

| Camada     | Tecnologia                                    |
| ---------- | --------------------------------------------- |
| Frontend   | React 19, TypeScript, Tailwind CSS, Zustand   |
| Backend    | Java 21, Spring Boot 3.4, Spring Modulith     |
| Engine     | Go 1.23, Cobra CLI, gRPC                      |
| Database   | PostgreSQL 16 (prod), H2 (test)               |
| Cache      | Caffeine (in-memory)                          |
| Streaming  | Apache Kafka 3.7 (KRaft) — opcional           |
| Policy     | OPA (Open Policy Agent)                       |
| Container  | Docker Compose                                |
| CI/CD      | GitHub Actions                                |

## Estrutura do Projeto

```
├── frontend/          React 19 SPA (Vite)
│   ├── src/modules/   13 módulos (design, provision, observe, cost, etc.)
│   ├── src/store/     Zustand stores (20+)
│   ├── src/api/       HTTP clients (JWT auth)
│   └── src/components/ shadcn/ui wrappers
│
├── backend/           Java 21 + Spring Boot
│   └── src/main/java/com/cloudbuilder/
│       ├── design/    Canvas, Code Generation, Validation
│       ├── provision/ Deploy, Drift, Ephemeral, DR
│       ├── observe/   Health, Alerts, Service Map
│       ├── cost/      Budget, Cost Records, Anomaly Detection
│       ├── aiops/     Incidents, AI Analysis
│       ├── iam/       Users, Roles, Permissions, Tenants
│       ├── git/       Git scanner, IaC detector
│       ├── audit/     Audit events
│       └── shared/    Security, Events, Kernel
│
├── provision-engine/  Go 1.23 CLI
│   ├── api/grpc/      gRPC server
│   ├── drift/         Drift detection
│   ├── executor/      Deployment executor
│   ├── generator/     Terraform/OpenTofu generation
│   └── messaging/     Kafka integration
│
├── opa/               Rego policies
├── .github/workflows/ CI/CD pipelines
└── docs/              Architecture, ADRs, roadmap
```

## Convenções

### Frontend
- UI text em PT-BR
- `lucide-react` para ícones
- `cn()` para conditional classes
- Zustand para state management
- shadcn/ui para componentes

### Backend
- Hexagonal architecture por módulo
- No Lombok (JDK 25 incompatibility)
- JPA entities com String IDs (UUID)
- Multi-tenant via `tenantId` + `TenantFilter`
- `@PreAuthorize` para RBAC

### Go Engine
- Cobra CLI
- gRPC server
- Kafka producer (segmentio/kafka-go)
- zerolog para logging
