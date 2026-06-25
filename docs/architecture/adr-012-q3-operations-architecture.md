# ADR-012: Q3 2026 Operations Architecture

**Status**: Implemented
**Date**: 2026-06-19
**Author**: Principal Architect Agent

> **Verificado em 2026-06-21**: Todas as 7 decisões arquiteturais verificadas no código: (1) PostgreSQL RANGE partitioning via V9/V11 migrations, (2) AnomalyDetectionService (moving average + stddev), (3) ComplianceService (strategy pattern com 3 regras), (4) Modulith domain events (CodeGeneratedEvent), (5) CostProjectionService (linear regression 90d), (6) @Scheduled services (AlertEvaluationService 30s, SloService hourly), (7) AuditQueryService (Spring Data Specifications). Todos os 54+ arquivos Java e 4 componentes frontend implementados nas sessões 2026-06-19/20.

## Context
CloudBuilder MVP is complete. Q3 2026 shifts focus to Operations — observability, cost management, and audit/compliance. The existing codebase has:
- Observe module with basic Alert + ServiceHealth + HealthCheckService
- Cost module with Budget + CostRecord + CostScenario + basic services
- Audit module with AuditEvent + basic services
- Frontend UIs for AlertRules, Incidents, SLO (calling /observability/* endpoints)
- Schema.sql already defines 12 observability tables (partitioned)

## Problem
How to design the Q3 2026 Operations architecture to maximize reuse, minimize new dependencies, and maintain consistency with existing patterns?

## Decision

### 1. Database: PostgreSQL Native Partitioning
**Chosen**: PostgreSQL native RANGE partitioning on timestamp columns.
**Alternatives considered**: Application-level sharding (separate tables per month), TimescaleDB hypertables, VictoriaMetrics.
**Rationale**: Partition pruning for time-range queries, DETACH for archival, same database — zero new dependencies. PostgreSQL 16 has mature partitioning support.
**Consequences**: Primary keys must include partition column. Migration needed for existing tables.

### 2. Anomaly Detection: Custom Composite (Z-score + Trend-Adjusted Baseline)
**Chosen**: Weighted baseline (30% short-window 7d + 70% long-window 30d) + day-of-week seasonal adjustment + Z-score deviation.
**Alternatives considered**: Pure Z-score (over-flags on trended data), Moving Average (lags on spikes), Isolation Forest (overkill for <100K records/month).
**Rationale**: Best balance of simplicity vs accuracy for cost time-series data. <5% expected false positive rate.
**Consequences**: Threshold constants may need per-service tuning in production.

### 3. Compliance Rules: Strategy Pattern
**Chosen**: `ComplianceRuleStrategy` interface with auto-discovered implementations.
**Alternatives considered**: Rule evaluation via JSON config (not type-safe), hardcoded rules (not extensible).
**Rationale**: New compliance rules = new @Component implementing interface. Extensible without modifying existing code.
**Consequences**: 4 initial strategies to build, more can be added later.

### 4. Cross-Module Communication: Modulith Domain Events
**Chosen**: Spring Modulith `ApplicationEventPublisher` for BudgetThresholdBreachedEvent → Observe module.
**Alternatives considered**: Kafka topic (heavyweight for single-JVM, removed infra Phase 4), direct service injection (tight coupling).
**Rationale**: Loose coupling. Observe module can subscribe without Cost module knowing about it. Same JVM — no serialization overhead. Kafka/Redis were removed in Phase 4 infra cleanup ($0 infra strategy); Caffeine cache replaced Redis for in-process caching.
**Consequences**: Only works within same Spring Boot process. If modules are split into separate services later, re-evaluate message broker (Kafka/PubSub) at that point.

### 5. Cost Projection: Linear Regression
**Chosen**: Ordinary least squares linear regression on 90-day daily aggregated costs.
**Alternatives considered**: ARIMA (complex, overkill), Facebook Prophet (heavy dependency), Simple moving average (no trend detection).
**Rationale**: Simple, interpretable, sufficient for monthly cost trend prediction with ~90 data points.
**Consequences**: May underperform on highly seasonal data. Can upgrade to Prophet later if needed.

### 6. Scheduled Services Over Event-Triggered
**Chosen**: All core operational services use `@Scheduled` with fixed intervals (AlertEvaluation 30s, SLO hourly, Budget daily, Compliance daily).
**Alternatives considered**: Event-triggered evaluation (callback per metric ingestion), continuous evaluation.
**Rationale**: Alert evaluation is time-based (30s window), not event-driven. SLO and budget checks are naturally periodic. Scheduled services are simpler to reason about and test.
**Consequences**: ~5s latency between metric ingestion and alert detection maximum.

### 7. Audit Query: Spring Data JPA Specifications
**Chosen**: `JpaSpecificationExecutor` with `Specification<AuditEvent>` for dynamic query building.
**Alternatives considered**: QueryDSL (more verbose), JPQL/Criteria API (string concatenation risk), Native queries (less portable).
**Rationale**: Type-safe, Spring-native, no additional dependencies. Supports dynamic filter combinations.
**Consequences**: Each filter combination produces a new query plan. Monitor for N+1 query plans with many filter variations.

## Consequences
1. **28 new Java files** for Sprint 9 (entities + services + controllers for observability)
2. **12 new Java files** for Sprint 10 (cost anomalies, projections, budget alerts)
3. **14 new Java files** for Sprint 11 (compliance engine, audit enhancements, partitioning)
4. **4 new frontend components** + 8 modified files
5. **All mutations audited** via AuditService
6. **Tenant isolation** maintained via existing TenantFilter pattern

## References
- ADR-008: Native Observability Subsystem (PostgreSQL-native)
- ADR-010: Backend Quality Gate (UUID→String migration)
- ADR-020: Policy-as-Code with OPA (compliance rule evaluation via OPA sidecar)
- ADR-029: Compliance & Governance Framework (supersedes section 3 with full compliance model)
- schema.sql: Existing observability schema (12 tables, partitioned)
- HealthCheckService.java: Existing @Scheduled pattern (30s)
- AuditService.java: Existing audit recording pattern
