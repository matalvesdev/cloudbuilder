# CloudBuilder — System Architecture

## High-Level System Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CLOUDBUILDER PLATFORM                            │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                          FRONTEND (React)                               ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ ││
│  │  │  Design  │ │ Provision│ │  Observe │ │  Cost    │ │  Settings    │ ││
│  │  │  Canvas  │ │  View    │ │  Dashbrd │ │  Report  │ │  Admin       │ ││
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │ HTTPS                                  │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                     API GATEWAY (Spring Cloud Gateway)                  ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ ││
│  │  │  Auth    │ │  Rate    │ │  Route   │ │  Logger  │ │  WebSocket   │ ││
│  │  │  Filter  │ │  Limiter │ │  Matcher │ │          │ │  Handler     │ ││
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                        │
│         ┌──────────────────────────┼──────────────────────────┐            │
│         ▼                          ▼                          ▼            │
│  ┌──────────────┐         ┌──────────────┐          ┌──────────────┐      │
│  │  Kafka       │◄────────│  Backend     │─────────►│  Kafka       │      │
│  │  (Events)    │────────►│  Modulith    │◄─────────┤  (Events)    │      │
│  └──────────────┘         │  (Java 21/   │          └──────────────┘      │
│                           │   Spring     │                                │
│                           └──────┬───────┘                                │
│                                  │ gRPC                                    │
│                                  ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    PROVISION ENGINE (Go)                            │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────────┐  │  │
│  │  │  Code    │ │  Deploy  │ │  State   │ │  Drift Detection     │  │  │
│  │  │  Gen     │ │  Engine  │ │  Manager │ │                      │  │  │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────────────────────┘  │  │
│  │       │            │           │                                  │  │
│  │       ▼            ▼           ▼                                  │  │
│  │  ┌──────────────────────────────────────────────────────────┐    │  │
│  │  │           Terraform/OpenTofu Binary                       │    │  │
│  │  └──────────────────────────────────────────────────────────┘    │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    DATA LAYER                                    │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐               │  │
│  │  │ PostgreSQL │  │   Redis    │  │  S3/MinIO  │               │  │
│  │  │ (Primary)  │  │  (Cache)   │  │ (Artifacts)│               │  │
│  │  └────────────┘  └────────────┘  └────────────┘               │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │              OBSERVABILITY STACK                                 │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐               │  │
│  │  │ Prometheus │  │  OpenTele. │  │   Grafana  │               │  │
│  │  │ (Metrics)  │  │  Collector │  │  (Visual.) │               │  │
│  │  └────────────┘  └─────┬──────┘  └────────────┘               │  │
│  │                        │                                       │  │
│  │  ┌─────────────────────▼────────────────────────────────────┐  │  │
│  │  │  OpenTelemetry Backend (Tempo/Loki/OpenTelemetry Native) │  │  │
│  │  └──────────────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Backend Service Architecture (Spring Modulith)

```
com.cloudbuilder
├── design.module
├── provision.module
├── observe.module
├── cost.module
├── platform.module
├── aiops.module
├── iam.module
├── audit.module
└── shared
    ├── kernel (common entities, value objects, base classes)
    ├── event (DomainEvent interface, EventBus)
    ├── messaging (Kafka producer/consumer config)
    ├── security (JWT, RBAC, multi-tenancy filter)
    └── monitoring (OpenTelemetry config, health endpoints)
```

## Inter-Module Communication

| Communication Type | Method | Use Case |
|-------------------|--------|----------|
| Synchronous | REST API (internal) | Query operations, CRUD |
| Synchronous | gRPC | Provision Engine ↔ Backend |
| Async (internal) | Spring Events | Within-module internal events |
| Async (cross-module) | Kafka | Cross-module domain events |
| Real-time | WebSocket | Canvas collaboration, deployment logs |

## API Architecture

- **REST API**: OpenAPI 3.0 documented, JSON request/response
- **GraphQL** (optional): For complex queries (dashboards, cost explorer)
- **WebSocket**: STOMP over WebSocket for real-time updates
- **gRPC**: Bidirectional streaming for deployment logs
