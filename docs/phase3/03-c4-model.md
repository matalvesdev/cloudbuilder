# CloudBuilder — C4 Model

## Level 1: System Context Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     CloudBuilder Platform                        │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Design    │  │  Provision  │  │   Observe   │             │
│  │   Module    │  │   Module    │  │   Module    │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐             │
│  │    Cost     │  │  Platform   │  │    AIOps    │             │
│  │   Module    │  │   Catalog   │  │   Module    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
         │                │                │
         ▼                ▼                ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────────┐
│   Users     │  │ Cloud       │  │ External Systems│
│ (Browser)   │  │ Providers   │  │ (Git, CI/CD,    │
│             │  │ (AWS/Azure/ │  │  PagerDuty,     │
│             │  │  GCP/K8s)   │  │  SSO, LLMs)     │
└─────────────┘  └─────────────┘  └─────────────────┘
```

## Level 2: Container Diagram (Backend)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           CloudBuilder Platform                              │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Web App     │  │  API Gateway │  │  Backend     │  │  Provision   │    │
│  │  (React +    │──┤  (Spring     │──┤  Modulith    │──┤  Engine Go   │    │
│  │   ReactFlow) │  │   Cloud)     │  │  (Java/Spring)│  │  (gRPC)      │    │
│  └──────────────┘  └──────────────┘  └──────┬───────┘  └──────────────┘    │
│                                              │                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────▼───────┐  ┌──────────────┐    │
│  │  Redis       │  │  PostgreSQL  │  │  Kafka       │  │  LLM Service │    │
│  │  (Cache/     │  │  (Primary DB) │  │  (Event Bus) │  │  (AI/ML)    │    │
│  │   Session)   │  │              │  │              │  │             │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  OpenTelemetry Collector                                              │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                │   │
│  │  │ Metrics  │ │  Logs    │ │  Traces  │ │  Exports │                │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘                │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Level 3: Component Diagram (Design Module)

```
┌──────────────────────────────────────────────────────────────────┐
│                     Design Module (Spring Modulith)               │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                    Web Layer (REST API)                    │    │
│  │  ┌──────────────────┐  ┌────────────────────────────────┐ │    │
│  │  │  CanvasController│  │  ComponentDefinitionController │ │    │
│  │  └────────┬─────────┘  └──────────────┬─────────────────┘ │    │
│  └───────────┼────────────────────────────┼───────────────────┘    │
│              │                            │                        │
│  ┌───────────▼────────────────────────────▼───────────────────┐   │
│  │                  Application Layer                            │   │
│  │  ┌──────────────────┐  ┌──────────────┐  ┌───────────────┐ │   │
│  │  │  CanvasService   │  │  Validation  │  │  ExportService│ │   │
│  │  └────────┬─────────┘  │  Service     │  └───────────────┘ │   │
│  └───────────┼────────────└──────────────┘────────────────────┘   │
│              │                                                     │
│  ┌───────────▼────────────────────────────────────────────────┐   │
│  │                   Domain Layer                                │   │
│  │  ┌─────────┐ ┌───────────┐ ┌──────────┐ ┌──────────────┐  │   │
│  │  │  Canvas │ │ Component │ │Connection│ │  Validator   │  │   │
│  │  │ Aggregate│ │ Aggregate │ │ ValueObj │ │  Interface  │  │   │
│  │  └─────────┘ └───────────┘ └──────────┘ └──────────────┘  │   │
│  └────────────────────────────────────────────────────────────┘   │
│              │                                                     │
│  ┌───────────▼────────────────────────────────────────────────┐   │
│  │               Infrastructure Layer (Ports/Adapters)          │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌────────────────────┐  │   │
│  │  │ JPA Repository│ │ Kafka        │ │  REST Adapter     │  │   │
│  │  │ (PostgreSQL)  │ │ Publisher    │ │  (External APIs)  │  │   │
│  │  └──────────────┘ └──────────────┘ └────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

## Level 4: Code Organization (Spring Modulith Modules)

```
com.cloudbuilder
├── design
│   ├── domain
│   │   ├── model (Canvas, Component, Connection)
│   │   ├── service (CanvasService, ValidationService)
│   │   ├── event (ComponentAdded, DesignSaved, DesignValidated)
│   │   ├── port (CanvasRepository, ComponentDefinitionRepository)
│   │   └── validator (ValidationRule interface implementations)
│   ├── application
│   │   ├── dto (CanvasRequest, CanvasResponse)
│   │   └── usercase (CreateCanvasUseCase, UpdateComponentUseCase)
│   └── infrastructure
│       ├── persistence (JpaCanvasRepository, JpaComponentRepository)
│       ├── messaging (KafkaCanvasEventPublisher)
│       └── web (CanvasController, ComponentDefinitionController)
├── provision
├── observe
├── cost
├── platform
├── aiops
├── iam
└── audit
```
