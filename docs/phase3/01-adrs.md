# CloudBuilder — Architecture Decision Records (ADRs)

## ADR-001: Spring Modulith for Backend Modularization

**Status**: Accepted  
**Date**: 2026-06-08  
**Context**: We need a modular monolith architecture that allows each bounded context to be independently developed, tested, and potentially extracted into microservices later.  
**Decision**: Use Spring Modulith to enforce module boundaries, enable event-driven communication between modules, and provide testing support for modular applications.  
**Consequences**: 
- Modules communicate via Spring Events (sync) and Kafka (async)
- Module boundaries are enforced at compile-time via `module-info.java` or package patterns
- Future extraction to microservices is supported via Modulith's event externalization
- Simplifies initial deployment compared to microservices

## ADR-002: React Flow for Canvas Rendering

**Status**: Accepted  
**Date**: 2026-06-08  
**Context**: The canvas is the core UI element. It must support 500+ nodes at 60fps, custom node types, edge routing, and interactive drag-and-drop.  
**Decision**: Use React Flow (xyflow/react) as the canvas library. It provides the best balance of performance, extensibility, and React-native API.  
**Consequences**:
- Custom node components for each infrastructure provider
- React Flow's internal graph model maps to our domain model
- Performance optimization needed for >500 nodes (virtualization, memoization)
- React Flow Pro license required for advanced features

## ADR-003: Apache Kafka for Async Event Bus

**Status**: Accepted  
**Date**: 2026-06-08  
**Context**: Events must flow between bounded contexts reliably, with at-least-once delivery, ordering guarantees, and replay capability.  
**Decision**: Use Apache Kafka as the inter-module event bus.  
**Consequences**:
- Each bounded context publishes domain events to Kafka topics
- Consumer groups allow independent scaling of subscribers
- Event schema evolution managed via Avro/Protobuf with Schema Registry
- Kafka Connect for external system integration
- Operational complexity of managing Kafka cluster

## ADR-004: OpenTelemetry as Observability Standard

**Status**: Accepted  
**Date**: 2026-06-08  
**Context**: All services must emit consistent telemetry data. We need a vendor-neutral standard for metrics, logs, and traces.  
**Decision**: Adopt OpenTelemetry as the observability standard across all modules.  
**Consequences**:
- All backend services instrumented with OpenTelemetry SDK
- OTLP exporter sends telemetry to the Observe module
- Traces correlate across all bounded contexts
- Prometheus metrics exported via OpenTelemetry Collector
- Vendor lock-in avoided — can switch backends

## ADR-005: PostgreSQL with Schemas for Multi-Tenancy

**Status**: Accepted  
**Date**: 2026-06-08  
**Context**: CloudBuilder must support multi-tenancy with strict data isolation.  
**Decision**: Use PostgreSQL schema-per-tenant model with connection pooling via PgBouncer.  
**Consequences**:
- Each tenant gets a dedicated PostgreSQL schema
- Schema migrations run per-tenant
- Row-level security for cross-schema queries
- Shared connection pool via PgBouncer
- Tenant isolation without separate database instances

## ADR-006: Go for Provision Engine

**Status**: Accepted  
**Date**: 2026-06-08  
**Context**: The Provision Engine needs to execute Terraform/OpenTofu CLI commands, parse structured output, and handle long-running operations without blocking.  
**Decision**: Implement the Provision Engine in Go for its excellent subprocess management, concurrent execution model, and minimal resource footprint.  
**Consequences**:
- Communication with Java backend via gRPC or Kafka
- Go's native concurrency handles parallel deployments
- Terraform binary executed as subprocess with output streaming
- Smaller container image for the provision engine

## ADR-007: Redis for Caching and Session State

**Status**: Accepted  
**Date**: 2026-06-08  
**Context**: Canvas state, temporary computations, and session data need fast, ephemeral storage.  
**Decision**: Use Redis for caching layer, session management, and real-time collaboration state.  
**Consequences**:
- Canvas auto-save state in Redis before persistence
- WebSocket sessions for collaboration stored in Redis
- Rate limiting counters
- Cache-aside pattern for metadata queries
- Redis Sentinel for high availability

## ADR-008: Clean + Hexagonal Architecture

**Status**: Accepted  
**Date**: 2026-06-08  
**Context**: The platform must be testable with infrastructure concerns isolated, support multiple providers, and follow DDD principles.  
**Decision**: Combine Clean Architecture (inner core domain, outer adapters) with Hexagonal Architecture (ports and adapters).  
**Consequences**:
- Domain layer has zero external dependencies
- Application services orchestrate domain logic
- Adapters implement ports for DB, Kafka, REST, etc.
- Full testability with mocked adapters
- Provider abstraction via adapter pattern
