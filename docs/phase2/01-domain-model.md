# CloudBuilder — Domain Model

## Core Domain: Cloud Infrastructure Lifecycle Management

### Subdomains

| Subdomain | Type | Description |
|-----------|------|-------------|
| **Canvas Design** | Core | Visual infrastructure modeling |
| **Code Generation** | Core | Terraform/OpenTofu generation from canvas |
| **Provisioning** | Core | Infrastructure deployment lifecycle |
| **Observability** | Supporting | Metrics, logs, traces collection |
| **Cost Management** | Supporting | FinOps, cost tracking, optimization |
| **Platform Catalog** | Supporting | Service catalog, golden paths |
| **AI Operations** | Core | AI-powered analysis and recommendations |
| **Identity & Access** | Generic | Authentication, authorization, RBAC |
| **Audit** | Supporting | Immutable audit trail |
| **Notifications** | Generic | Alerting and notification delivery |

## Entity Relationship Model (Core)

```
Tenant
  ├── User (aggregate root)
  ├── Design (aggregate root)
  │     ├── Canvas
  │     │     ├── Component
  │     │     │     ├── Property (value object)
  │     │     │     ├── SecurityGroup (value object)
  │     │     │     └── Tag (value object)
  │     │     ├── Connection
  │     │     │     ├── Source (value object)
  │     │     │     └── Target (value object)
  │     │     └── ValidationResult (value object)
  │     └── Version (value object)
  ├── Blueprint (aggregate root)
  │     └── Template (value object)
  ├── Environment (aggregate root)
  │     ├── Stack
  │     │     ├── Resource
  │     │     └── State (value object)
  │     └── Deployment (entity)
  ├── ComponentDefinition (aggregate root)
  │     ├── PropertyDefinition (value object)
  │     └── ProviderMapping (value object)
  ├── GeneratedCode (entity)
  ├── DriftReport (value object)
  ├── Observation (aggregate root)
  │     ├── Metric (entity)
  │     ├── Log (entity)
  │     └── Trace (entity)
  ├── CostReport (aggregate root)
  │     ├── CostEntry (entity)
  │     └── Budget (entity)
  ├── Recommendation (entity)
  ├── Incident (aggregate root)
  │     └── IncidentEvent (entity)
  ├── Policy (aggregate root)
  └── AuditEvent (entity)
```

## Key Domain Events

| Event | Description |
|-------|-------------|
| ComponentAddedToCanvas | User added a component to the design |
| ComponentConnected | Two components were connected |
| DesignValidated | Design passed validation checks |
| DesignVersionCreated | A new version of the design was saved |
| CodeGenerated | Terraform code was generated from design |
| DeploymentStarted | Provisioning workflow initiated |
| DeploymentCompleted | Infrastructure successfully provisioned |
| DeploymentFailed | Provisioning failed |
| DriftDetected | Difference found between design and actual state |
| ResourceCreated | New cloud resource discovered/provisioned |
| MetricThresholdBreached | Metric crossed alert threshold |
| IncidentCreated | New incident detected |
| IncidentResolved | Incident marked as resolved |
| CostAnomalyDetected | Unusual cost pattern identified |
| RecommendationGenerated | AI produced a new recommendation |
| BudgetExceeded | Spending exceeded budget threshold |
| PolicyViolated | Infrastructure violated a policy rule |
