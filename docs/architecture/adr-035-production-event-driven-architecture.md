# ADR-035: Production Event-Driven Architecture (Kafka-based)

**Status**: Proposed
**Date**: 2026-06-28
**Author**: Principal Architect (FAANg)
**References**: ADR-012 (Q3 Operations), ADR-016 (GitOps Webhook Event-Driven), ADR-034 (MVP Event-Driven Architecture)

## Context

CloudBuilder's MVP Event-Driven Architecture (ADR-034) successfully implemented a three-layer event system using Spring Modulith events + SSE + gRPC streaming. However, this architecture has fundamental limitations for production-scale operations:

### Current MVP Architecture Limitations

1. **No Event Persistence**: Events are in-memory only — lost on JVM restart
2. **No Replay Capability**: Cannot reprocess events for debugging or recovery
3. **Single JVM Bottleneck**: All cross-module events pass through one Spring context
4. **No Partitioning**: Cannot scale consumers horizontally
5. **No Dead Letter Queue**: Failed events are lost without retry
6. **No Schema Registry**: No versioning or compatibility checks for events

### Production Requirements

CloudBuilder's production architecture requires:

- **Event Persistence**: All events must survive restarts
- **Event Replay**: Ability to reprocess events for debugging
- **Horizontal Scaling**: Multiple consumer instances
- **Reliability**: At-least-once delivery with DLQ
- **Schema Evolution**: Versioned event contracts
- **Observability**: End-to-end event tracing

## Decision

### Adopt Production Event-Driven Architecture with Kafka

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CLOUDBUILDER – EVENT DRIVEN ARCHITECTURE (EDA)       │
│                                                                         │
│  EVENT SOURCES (PRODUCERS)                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │ Canvas      │ │ AI Architect│ │ Terraform   │ │ Provisioning│      │
│  │ Service     │ │ Service     │ │ Generator   │ │ Engine      │      │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘      │
│         │               │               │               │              │
│  ┌──────┴──────┐ ┌──────┴──────┐ ┌──────┴──────┐ ┌──────┴──────┐      │
│  │ Deployment  │ │ GitOps      │ │ Observability│ │ FinOps     │      │
│  │ Engine      │ │ Service     │ │ Service      │ │ Service    │      │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘      │
│         │               │               │               │              │
│  ┌──────┴──────┐ ┌──────┴──────┐                                      │
│  │ Security    │ │ User/Identity│                                      │
│  │ Service     │ │ Service      │                                      │
│  └──────┬──────┘ └──────┬──────┘                                      │
│         │               │                                               │
│         └───────────────┼───────────────────────────────────────────────┘
│                         │                                               │
│                         ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                    EVENT BUS / EVENT BROKER                         ││
│  │                    ┌─────────────────────┐                         ││
│  │                    │      kafka          │                         ││
│  │                    │  • Particionado     │                         ││
│  │                    │  • Replicado        │                         ││
│  │                    │  • Durável          │                         ││
│  │                    └─────────────────────┘                         ││
│  │                                                                     ││
│  │  EVENT STREAMS (TOPICS)                                            ││
│  │  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐         ││
│  │  │ canvas.events  │ │ gitops.events  │ │ observability  │         ││
│  │  │ architecture   │ │ kubernetes     │ │ .events        │         ││
│  │  │ .events        │ │ .events        │ │ finops.events  │         ││
│  │  │ terraform      │ │ resource.events│ │ policy.events  │         ││
│  │  │ .events        │ │ security.events│ │ cost.events    │         ││
│  │  │ provisioning   │ │ identity.events│ │ inventory      │         ││
│  │  │ .events        │ │                │ │ .events        │         ││
│  │  │ deployment     │ │                │ │ system.events  │         ││
│  │  │ .events        │ │                │ │                │         ││
│  │  └────────────────┘ └────────────────┘ └────────────────┘         ││
│  │                                                                     ││
│  │  SCHEMA REGISTRY ─── EVENT CATALOG ─── VERSION CONTROL             ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                         │                                               │
│                         ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                    INTEGRATION PATTERNS                            ││
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐     ││
│  │  │ OUTBOX     │ │ INBOX      │ │ SAGA       │ │COMPENSATING│     ││
│  │  │ PATTERN    │ │ PATTERN    │ │ PATTERN    │ │ ACTIONS    │     ││
│  │  │ Publicação │ │ Processa-  │ │ Transações │ │ Rollback   │     ││
│  │  │ confiável  │ │ mento      │ │ distribui- │ │ lógico     │     ││
│  │  │ de eventos │ │ idempotente│ │ das        │ │            │     ││
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘     ││
│  │  ┌────────────┐ ┌────────────┐                                   ││
│  │  │ DEAD LETTER│ │ RETRY      │                                   ││
│  │  │ QUEUE (DLQ)│ │ POLICY     │                                   ││
│  │  │ Falhas não │ │ Retry com  │                                   ││
│  │  │ recuperáv. │ │ backoff    │                                   ││
│  │  └────────────┘ └────────────┘                                   ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                         │                                               │
│                         ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                    EVENT CONSUMERS (SUBSCRIBERS)                   ││
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐     ││
│  │  │ Projection │ │ Notification│ │ Audit      │ │ Policy     │     ││
│  │  │ Service    │ │ Service    │ │ Service    │ │ Enforcement│     ││
│  │  │ Atualiza   │ │ Envia      │ │ Armazena   │ │ Aplica     │     ││
│  │  │ Read Models│ │ e-mails,   │ │ trilhas de │ │ políticas  │     ││
│  │  │            │ │ SMS, Slack │ │ auditoria  │ │ e regras   │     ││
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘     ││
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐     ││
│  │  │ AI Advisor │ │ Cost       │ │ Search     │ │ Read Model │     ││
│  │  │ Service    │ │ Analyzer   │ │ Service    │ │ Stores     │     ││
│  │  │ Consome    │ │ Processa   │ │ Indexa     │ │ Bancos     │     ││
│  │  │ eventos    │ │ eventos de │ │ eventos    │ │ otimizados │     ││
│  │  │ p/ insights│ │ custos     │ │ p/ busca   │ │ p/ leitura │     ││
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                         │                                               │
│                         ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                    READ MODELS (DATA STORES)                       ││
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐     ││
│  │  │ PostgreSQL │ │ ClickHouse │ │ Elasticsearch│ │ Redis      │     ││
│  │  │ (Analytics)│ │ (Métricas) │ │ (Logs/Search)│ │ (Cache)    │     ││
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘     ││
│  │  ┌────────────┐ ┌────────────┐                                   ││
│  │  │ TimescaleDB│ │ S3/Object  │                                   ││
│  │  │ (Metrics TS)│ │ Store      │                                   ││
│  │  └────────────┘ └────────────┘                                   ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  CROSS-CUTTING INFRAESTRUTURA                                          │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐         │
│  │ Monitoring │ │ Tracing    │ │ Logging    │ │ Alerting   │         │
│  │ (Prometheus)│ │(OpenTelemetry)│ │(ELK/Loki) │ │(Alertmanager)│    │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘         │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                        │
│  │ DLQ Storage│ │ Secrets    │ │ Config     │                        │
│  │            │ │ Manager    │ │ Service    │                        │
│  └────────────┘ └────────────┘ └────────────┘                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### Event Flow (Exemplo)

```
1. Ação do Usuário (Canvas)
   ↓
2. Canvas Service (Produz Evento)
   ↓
3. Event Bus (Kafka)
   ↓
4. Consumers (Projeção e Reação)
   ↓
5. Read Model Atualizado
```

### Eventual Consistency

```
Write Events → Processamento Assíncrono → Read Model Atualizado
(pode levar alguns segundos)
```

### Event Schema Standard

```json
{
  "eventId": "evt_01HX7...",
  "eventType": "infra.resource.created",
  "aggregateId": "res_vpc_01HX7...",
  "aggregateType": "vpc",
  "version": 1,
  "occurredAt": "2025-05-24T10:38:00Z",
  "correlationId": "corr_01HX7...",
  "causationId": "cmd_01HX7...",
  "data": { ... }
}
```

### Event Catalog (Principais)

| Categoria | Eventos |
|-----------|---------|
| **Design** | `canvas.infra.created`, `architecture.generated`, `terraform.generated` |
| **Provisioning** | `provisioning.started`, `resource.created`, `deployment.started` |
| **GitOps** | `gitops.sync.requested`, `kubernetes.pod.created` |
| **Observability** | `observability.metric.collected`, `observability.alert.triggered` |
| **FinOps** | `finops.cost.processed`, `finops.budget.exceeded` |
| **Security** | `security.policy.violated`, `security.scan.completed` |
| **Billing** | `billing.invoice.generated`, `billing.payment.succeeded` |
| **System** | `system.health.changed`, `system.config.changed` |

### Características

1. **Desacoplamento completo entre serviços**
2. **Escalabilidade horizontal ilimitada**
3. **Resiliência com Retry, DLQ e Idempotência**
4. **Evolução de contratos (Versionamento)**
5. **Observabilidade ponta a ponta**
6. **Suporte a Sagas e Transações Distribuídas**

## Alternatives Considered

### A1: Keep MVP Event-Driven Architecture (Spring Modulith + SSE)

**Prós**:
- Zero new dependencies
- Zero infrastructure cost
- Simple implementation

**Contras**:
- No event persistence (lost on restart)
- No replay capability
- Single JVM bottleneck
- No horizontal scaling
- No DLQ

**Veredito**: Rejeitado — insufficient for production workloads.

### A2: Apache Kafka with Schema Registry

**Prós**:
- Industry standard for event streaming
- Persistence, replay, partitioning
- Schema Registry for versioning
- Exactly-once semantics

**Contras**:
- Higher operational complexity
- Requires Kafka cluster management
- ~$200/month infrastructure cost

**Veredito**: **Selecionado** — best fit for production EDA requirements.

### A3: Apache Pulsar

**Prós**:
- Multi-tenancy native
- Built-in schema registry
- Tiered storage

**Contras**:
- Smaller community than Kafka
- Less mature tooling
- Higher learning curve

**Veredito**: Rejeitado — Kafka has better ecosystem and community support.

### A4: Amazon EventBridge

**Prós**:
- Serverless, no infrastructure management
- Native AWS integration
- Built-in schema registry

**Contras**:
- Vendor lock-in to AWS
- Higher per-event cost
- Limited replay capabilities

**Veredito**: Rejeitado — vendor lock-in contradicts multi-cloud strategy.

## Consequences

### Positive

1. **Event Persistence**: All events survive restarts via Kafka
2. **Event Replay**: Can reprocess events for debugging/recovery
3. **Horizontal Scaling**: Multiple consumer instances via consumer groups
4. **Reliability**: At-least-once delivery with DLQ
5. **Schema Evolution**: Versioned event contracts via Schema Registry
6. **Observability**: End-to-end event tracing via correlation IDs

### Negative

1. **Operational Complexity**: Requires Kafka cluster management
2. **Infrastructure Cost**: ~$200/month for Kafka cluster
3. **Learning Curve**: Team needs Kafka expertise

### Mitigations

1. **Managed Kafka**: Use Confluent Cloud or AWS MSK for operational simplicity
2. **Cost Optimization**: Start with single-node Kafka for MVP, scale as needed
3. **Training**: Kafka workshops for development team

## Implementation Plan

### Phase 1: Kafka Infrastructure (Week 1-2)
- Deploy Kafka cluster (Confluent Cloud or self-managed)
- Configure Schema Registry
- Set up monitoring (Prometheus + Grafana)

### Phase 2: Event Producers (Week 3-4)
- Refactor Go Engine EventPublisher to publish to Kafka
- Refactor Java Spring event publishers to use KafkaTemplate
- Implement Outbox Pattern for critical events

### Phase 3: Event Consumers (Week 5-6)
- Implement Projection Service for Read Model updates
- Implement Notification Service for alerts
- Implement Audit Service for compliance

### Phase 4: Read Models (Week 7-8)
- Deploy ClickHouse for metrics
- Deploy Elasticsearch for logs/search
- Configure TimescaleDB for time-series
- Set up Redis cache layer

### Phase 5: Integration Patterns (Week 9-10)
- Implement DLQ with retry policies
- Implement Saga Pattern for distributed transactions
- Implement Compensating Actions for rollback

### Phase 6: Observability (Week 11-12)
- End-to-end event tracing via correlation IDs
- Event flow monitoring dashboards
- Alerting on event processing failures

## References

- ADR-012: Q3 Operations Architecture
- ADR-016: GitOps Webhook Event-Driven
- ADR-034: MVP Event-Driven Architecture
- Apache Kafka Documentation
- Confluent Schema Registry
- Enterprise Integration Patterns (Gregor Hohpe)
- Designing Event-Driven Systems (Confluent)
