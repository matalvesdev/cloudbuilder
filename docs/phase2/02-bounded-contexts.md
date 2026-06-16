# CloudBuilder — Bounded Contexts

## Context Map

```
┌─────────────────────────────────────────────────────────────┐
│                    CloudBuilder Platform                     │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │    Design     │◄──►│  Provision   │◄──►│   Observe    │  │
│  │  (Core)       │    │  (Core)      │    │  (Supporting) │  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘  │
│         │                   │                   │          │
│         ▼                   ▼                   ▼          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │     Cost     │◄──►│   Platform   │◄──►│   AIOps      │  │
│  │  (Supporting) │    │   Catalog    │    │  (Core)      │  │
│  └──────────────┘    │  (Supporting) │    └──────┬───────┘  │
│                      └──────────────┘           │          │
│                         │                       │          │
│                         ▼                       ▼          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Shared Kernel (Modulith)                │   │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────────────┐  │   │
│  │  │   IAM    │ │  Audit   │ │  Notifications     │  │   │
│  │  └──────────┘ └──────────┘ └────────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Bounded Context Details

### 1. Design Context
- **Responsibility**: Visual canvas, components, connections, validation
- **Aggregates**: Design, ComponentDefinition, Blueprint
- **Events**: ComponentAddedToCanvas, DesignValidated, DesignVersionCreated
- **Domain Services**: ValidationService, LayoutService, ExportService
- **Repository**: DesignRepository, ComponentDefinitionRepository

### 2. Provision Context
- **Responsibility**: Code generation, deployment, state management, drift detection
- **Aggregates**: Environment, Stack, Deployment
- **Events**: CodeGenerated, DeploymentStarted, DeploymentCompleted, DriftDetected
- **Domain Services**: CodeGeneratorService, DeploymentOrchestrator, StateService
- **Repository**: EnvironmentRepository, StackRepository
- **External**: Terraform/OpenTofu CLI, Cloud provider APIs

### 3. Observe Context
- **Responsibility**: Metrics, logs, traces collection and analysis
- **Aggregates**: Observation, Dashboard, Alert
- **Events**: MetricThresholdBreached, IncidentCreated
- **Domain Services**: MetricsAggregationService, LogQueryService, TraceAnalysisService
- **Repository**: MetricRepository, LogRepository, TraceRepository
- **External**: OpenTelemetry Collector, Prometheus

### 4. Cost Context
- **Responsibility**: Cost tracking, forecasting, budgets, optimization
- **Aggregates**: CostReport, Budget
- **Events**: CostAnomalyDetected, BudgetExceeded
- **Domain Services**: CostCalculationService, ForecastService, RecommendationService
- **Repository**: CostRepository, BudgetRepository
- **External**: Cloud billing APIs

### 5. Platform Catalog Context
- **Responsibility**: Service catalog, golden paths, policies, scorecards
- **Aggregates**: CatalogItem, GoldenPath, Policy
- **Events**: PolicyViolated, CatalogItemPublished
- **Domain Services**: CatalogService, TemplateService, PolicyEngine
- **Repository**: CatalogRepository, PolicyRepository

### 6. AIOps Context
- **Responsibility**: RCA, incident analysis, recommendations, anomaly detection
- **Aggregates**: Incident, Recommendation
- **Events**: IncidentResolved, RecommendationGenerated
- **Domain Services**: RootCauseAnalysisService, IncidentClassifier, AnomalyDetector
- **Repository**: IncidentRepository, RecommendationRepository
- **External**: AI/ML models

### 7. IAM Context (Shared)
- **Responsibility**: Users, roles, permissions, authentication
- **Aggregates**: Tenant, User, Role
- **Domain Services**: AuthService, RbacService
- **Repository**: UserRepository, TenantRepository

### 8. Audit Context (Shared)
- **Responsibility**: Immutable action logging
- **Aggregates**: AuditEvent
- **Repository**: AuditEventRepository
