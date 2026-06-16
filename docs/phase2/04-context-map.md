# CloudBuilder — Context Map

## Integration Patterns Between Bounded Contexts

| Source Context | Target Context | Pattern | Mechanism | Description |
|---------------|---------------|---------|-----------|-------------|
| Design | Provision | Customer/Supplier | Domain Events (Kafka) | Design emits DesignValidated → Provision generates code |
| Design | Cost | Customer/Supplier | Domain Events (Kafka) | Design emits ComponentAdded → Cost calculates estimate |
| Design | Platform Catalog | Partnership | Shared Kernel (Modulith) | Catalog provides component definitions to Design |
| Design | AIOps | Partnership | Domain Events (Kafka) | Design data available for architecture recommendations |
| Provision | Observe | Customer/Supplier | Domain Events (Kafka) | Provision emits ResourceCreated → Observe monitors it |
| Provision | Cost | Customer/Supplier | Shared Kernel (Modulith) | Resource inventory shared with Cost for allocation |
| Provision | Design | Partnership | Shared Kernel (Modulith) | State mapping back to canvas components for drift |
| Observe | AIOps | Partnership | Domain Events (Kafka) | Metrics/Logs/Traces emitted for AI analysis |
| Observe | Cost | Customer/Supplier | Domain Events (Kafka) | Usage metrics used for cost allocation |
| Cost | AIOps | Partnership | Domain Events (Kafka) | Cost anomalies trigger AI investigation |
| AIOps | Incident | Partnership | Domain Events (Kafka) | AI recommendations attached to incidents |
| IAM | All | Shared Kernel | Modulith internal | Authentication/authorization shared across all contexts |
| Audit | All | Shared Kernel | Modulith internal | Audit events emitted from all contexts |

## Context Integration Map

```
                    ┌─────────────────────┐
                    │     Platform        │
                    │     Catalog         │
                    └──────────┬──────────┘
                               │ Partnership
                               ▼
┌──────────┐  Events  ┌──────────┐  Events  ┌──────────┐
│   Cost   │◄────────►│  Design  │◄────────►│ Provision│
│          │          │          │          │          │
└────┬─────┘          └────┬─────┘          └────┬─────┘
     │                     │                     │
     │ Events              │ Events              │ Events
     ▼                     ▼                     ▼
┌──────────┐          ┌──────────┐          ┌──────────┐
│  AIOps   │◄────────►│ Observe  │          │   IAM    │
│          │  Events  │          │          │          │
└──────────┘          └──────────┘          └──────────┘
                                                      │
                                                      ▼
                                               ┌──────────┐
                                               │  Audit   │
                                               └──────────┘
```

## Anti-Corruption Layers

| Context | External System | ACL Strategy |
|---------|---------------|--------------|
| Provision | Terraform CLI | CLI wrapper with structured output parsing |
| Provision | Cloud Provider APIs | Provider abstraction layer |
| Observe | OpenTelemetry | OTLP protocol adapter |
| Observe | Prometheus | Remote write/read adapter |
| Cost | Cloud Billing APIs | Billing data ingestion adapters |
| IAM | SSO Providers (OIDC/SAML) | Standard protocol adapters |
| AIOps | LLM Providers | Model abstraction layer |

## Context Ownership & Teams

| Context | Team | DDD Role |
|---------|------|----------|
| Design | Platform Design Team | Core Domain |
| Provision | Provision Engine Team | Core Domain |
| Observe | Observability Team | Supporting Subdomain |
| Cost | FinOps Team | Supporting Subdomain |
| Platform Catalog | Platform Engineering Team | Supporting Subdomain |
| AIOps | AI Engineering Team | Core Domain |
| IAM | Platform Security Team | Generic Subdomain |
| Audit | Platform Security Team | Supporting Subdomain |
