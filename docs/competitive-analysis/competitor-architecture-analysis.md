# Competitive Architecture Analysis: Patterns for CloudBuilder Evolution

**Author**: Principal Architect Agent -- FAANg Framework
**Date**: 2026-06-24
**Status**: Final
**Context**: Downstream to CloudBuilder observability subsystem scalability and architecture decisions

---

## 1. Executive Summary

This document analyzes system design patterns from 6 competitors (Grafana Stack, Datadog, Dynatrace, New Relic, Miro, Excalidraw) to guide CloudBuilder architectural evolution.

### Key Findings

| Pattern | Adopters | CloudBuilder Applicability |
|---|---|---|
| **Kafka as durable write buffer** | Grafana (Mimir/Tempo 3.0), Datadog (Husky), Dynatrace (Grail), New Relic (NRDB) | **HIGH** -- Bridge between Design/Provision/Observe |
| **Object storage as single source of truth** | Grafana (S3/GCS), Datadog (S3), New Relic (S3/Iceberg), Excalidraw (S3) | **HIGH** -- Terraform state, canvas snapshots, cost history |
| **Read/write path separation** | Grafana (ingester/querier), Datadog (Ostrich/Mothra), Dynatrace (Grail) | **HIGH** -- Canvas authoring independent from deployment monitoring |
| **Cellular architecture (fault isolation)** | New Relic (10 cells), Datadog (multi-region) | **MEDIUM** -- Phase 2 (post-MVP) |
| **OT/CRDT hybrid for collaboration** | Miro, Excalidraw | **HIGH** -- Design module multi-user editing |

### Convergence Signal

All 4 observability platforms converged on **Kafka + object storage + read/write separation** as the core architecture. This is a strong signal: CloudBuilder Observe module should adopt this pattern before scaling.

---

## 2. Grafana Stack

- **Mimir** (metrics): Ingester to Kafka to Store Gateway (object storage)
- **Tempo 3.0** (traces): Same Kafka decoupling pattern
- **Loki** (logs): No Kafka (direct to object storage)
- **Multi-tenancy**: X-Scope-OrgID header

| Aspect | Detail |
|---|---|
| **Write Path** | Distributor > Ingester (3x replica) > Kafka (WAL) > Compactor > Object storage |
| **Read Path** | Querier > Store Gateway (index + blobs) -- independent of write path |
| **Decoupling** | Kafka between write/read: ingester failures do not affect queryability |
| **Multi-tenancy** | X-Scope-OrgID header. Per-tenant limits, rate limiting, cost attribution |
| **Cost Attribution** | Per-tenant ingestion metrics. Rate limits with per-tenant overrides |
| **High Cardinality** | Series limiter per tenant. TSDB index per tenant |

### Lessons for CloudBuilder

1. Kafka between write and read paths decouples canvas saves from deployment monitoring.
2. Per-tenant limits applied at API gateway before reaching backend services.
3. Object storage as RF1 minimizes cost. Kafka provides durability.

---

## 3. Datadog

- **Metrics**: Memory aggregation > Ostrich (Rust, exhaustive index) > Husky (Kafka) > Mothra (query)
- **Traces**: Agent > Trace API > Kafka > Blob storage > Sampler
- **Logs**: Agent > Kafka > Logs API > Blob storage
- **Multi-region**: Active-active with regional pipelines

| Aspect | Detail |
|---|---|
| **Write Path** | Agent > Intake API > Ostrich (Rust) > Husky (Kafka) > S3 |
| **Read Path** | Mothra (distributed query engine) > S3 -- independent pipeline |
| **Exhaustive indexing** | Every timeseries fully indexed. No sampling at ingestion |
| **Rust rewrite** | 10x over Java. Zero GC pause on tail latencies |
| **Multi-region** | Per-region site endpoints. Data Federation for cross-region queries |
| **Cost attribution** | Per-host, per-index, per-custom-metric billing. Tags-based breakdown |

### Lessons for CloudBuilder

1. Exhaustive indexing: index everything at write time, enables arbitrary queries.
2. Rust for hot paths. Go is fine for orchestration in v1.
3. Husky pattern: Kafka for ordering/durability. Short Kafka retention (24h). S3 for storage.
4. Regional isolation: per-region pipelines prevent blast radius.

---

## 4. Dynatrace

- **OneAgent** > ActiveGate (aggregation) > Grail (S3-based data lake)
- **Davis AI**: Causation engine on Grail query results
- **Smartscape**: Real-time topology graph (similar to CloudBuilder canvas)

| Aspect | Detail |
|---|---|
| **Write Path** | OneAgent > ActiveGate (local aggregation, failover) > Grail API > Kafka > S3 |
| **Read Path** | Grail Query API > S3 (Parquet) > Davis AI > Dashboard -- fully decoupled |
| **Grail** | S3 data lake, Parquet. ELT: store raw, schema-on-read |
| **Davis AI** | Causal + predictive AI on stored data. Anomaly > root cause > auto-remediation |
| **Smartscape** | Real-time graph. Nodes=components, Edges=relationships |
| **Cost attribution** | Per-host consumption. Davis AI identifies optimization opportunities |

### Lessons for CloudBuilder

1. Schema-on-read (Grail): JSONB (v1) > S3+Parquet (v2). Enables schema evolution.
2. Canvas = Smartscape: CloudBuilder canvas IS CloudBuilder topology graph.
3. Davis pattern: AI on stored data (cost-history, drift-detection, deployment logs).
4. ActiveGate buffering: Provision engine buffers events locally before sending.

---

## 5. New Relic

- **NRDB**: Distributed telemetry DB. Cassandra-like cellular architecture.
- **Cellular**: 10 independent cells. Account assignment via hashing.
- **Iceberg migration**: NRDB v2 moving from custom columnar to Iceberg on S3

| Aspect | Detail |
|---|---|
| **Write Path** | Agent > Collector (LB) > Cell Kafka > NRDB Ingest > S3 |
| **Read Path** | Query Router > Cell Querier > NRDB > S3 |
| **Cellular** | 10 independent cells. 10% capacity overhead. 90-day cell lifespan |
| **NRDB v1** | Custom columnar. 50ms median query latency. Cellular isolation |
| **Iceberg** | Parquet on S3. ACID, schema evolution, time travel queries |
| **Cost attribution** | Per-account data ingested (GB). Breakdown by data type |

### Lessons for CloudBuilder

1. Cellular for isolation: Monolith > cells when tenant count > 100.
2. Iceberg as ultimate storage format for Observe module.
3. 50ms median query target. Materialized views for common aggregations.
4. 90-day cell lifecycle. Plan data migration at application layer.

---
## 6. Miro

### Architecture Overview

- **WebSocket + Redis Pub/Sub**: Real-time collaboration via WebSocket connections. Redis Pub/Sub for cross-instance message broadcast.
- **CRDT-based**: Conflict-free Replicated Data Types for concurrent edits.
- **Scalability model**: WebSocket connections distributed across nodes. Redis Pub/Sub fan-out to all nodes with connected clients to the same board.

### Key Architectural Patterns

| Aspect | Detail |
|---|---|
| **Real-time Protocol** | WebSocket for bidirectional communication. Redis Pub/Sub for cross-instance message distribution. Each board has a Redis channel |
| **Data Model** | CRDT (Conflict-free Replicated Data Types). Each element is an independent CRDT. Concurrent edits merge automatically without central conflict resolution |
| **CRDT vs OT** | Miro chose CRDT over OT (Operational Transformation). CRDT provides: (a) no central server for conflict resolution, (b) automatic merge of concurrent edits, (c) offline edit support, (d) simpler operational semantics |
| **Board Loading** | Lazy loading: only visible viewport elements loaded initially. Background elements loaded on scroll/pan |
| **Undo/Redo** | Local undo stack per client. Reverse operations broadcast as new CRDT operations |
| **Persistence** | PostgreSQL for board metadata and element tree. Periodic snapshots to S3 for long-term recovery |

### Lessons for CloudBuilder

1. **CRDT over OT for canvas collaboration**: CloudBuilder Design module should use CRDT (Yjs). No central conflict resolution. Works offline. Miro validated this at scale.
2. **WebSocket + Redis Pub/Sub**: Frontend (ReactFlow) connects via WebSocket to Spring backend. Redis Pub/Sub fans out canvas edits. Matches Provision Engine deployment events pattern.
3. **Lazy loading**: Load only visible viewport nodes. Pan/zoom triggers background loading. ReactFlow viewport API supports this natively.
4. **Local undo stack**: Avoid round-trips. Store reverse operations locally. Broadcast as new CRDT ops.

## 7. Excalidraw

### Architecture Overview

- **Single-player focus**: Primarily single-player canvas with optional real-time collaboration via collaboration server.
- **Socket.io**: WebSocket abstraction for real-time messaging. Fallback to long-polling when WebSocket unavailable.
- **File-based persistence**: Canvas saved as JSON (.excalidraw files). Can save to local filesystem, S3, or any backend via API.

### Key Architectural Patterns

| Aspect | Detail |
|---|---|
| **Real-time Protocol** | Socket.io (WebSocket + fallback long-polling). Binary compression for large canvases |
| **Data Model** | Version-based reconciliation (not CRDT/OT). Each canvas has a version number. Server rejects stale writes. Client merges on conflict |
| **Reconciliation** | On connect: server sends full canvas state. On edit: client sends diff, server applies, bumps version, broadcasts to other clients. Conflict resolution: last-write-wins per element |
| **Message Channels** | Two channels: (1) volatile (cursor positions, viewport changes — never persisted), (2) guaranteed (element adds, moves, deletes — persisted, ordered, at-least-once delivery) |
| **Persistence** | Server stores latest canvas state (JSON) in database or S3. No incremental/event-sourced storage. Full state save on each edit |
| **Offline Support** | Local-first: canvas data stored in IndexedDB (browser). Syncs on reconnect. Conflict resolution via version check |

### Lessons for CloudBuilder

1. **Volatile vs guaranteed channels**: CloudBuilder should separate ephemeral messages (cursor movements, selection highlights) from durable messages (node adds, edge creation, property changes). Volatile channel via Redis Pub/Sub (no persistence). Guaranteed channel via WebSocket + Kafka (persisted, ordered).
2. **Version-based reconciliation for documents**: For CloudBuilder docs/canvas exports, version-based reconciliation (simpler than CRDT) is sufficient. No concurrent editing of the same document expected at high frequency.
3. **Local-first persistence**: CloudBuilder should store canvas state in IndexedDB (local) AND sync to backend. This enables offline canvas editing. On reconnect, version check resolves conflicts.
4. **Socket.io pattern**: Excalidraw's Socket.io with fallback to long-polling is pragmatic for enterprise environments with restrictive firewalls. CloudBuilder should support WebSocket-with-fallback.

---

## 8. Cross-Cutting Concerns

### 8.1 High Cardinality

| Platform | Approach |
|---|---|
| Datadog | Exhaustive indexing in Rust (Ostrich). Every label indexed. Accepts high cardinality as a feature, not a problem |
| Grafana | Per-tenant series limits. TSDB index per tenant. Labels split across index header + postings files |
| New Relic | Dimensions indexed per account. Cellular isolation prevents one tenant's high cardinality from affecting others |
| Dynatrace | Schema-on-read (Grail/Parquet). High cardinality handled by columnar storage compression |

**CloudBuilder Recommendation**: Adopt Datadog's exhaustive indexing for cost records and deployment tags. Use PostgreSQL BRIN indexes + materialized views for common queries. When scale requires, migrate to Parquet + columnar storage.

### 8.2 Ingestion Spikes

| Platform | Approach |
|---|---|
| Grafana Mimir | Kafka as write buffer absorbs spikes. Distributor rejects at ingest if Kafka falls behind |
| Datadog | Agent-side buffering + memory aggregation before Kafka. Husky handles backlog |
| Dynatrace | ActiveGate local buffering with failover. Grail ingestion API rate-limits at ActiveGate level |
| New Relic | Collector load balancer + cell-specific Kafka. Backpressure via Kafka consumer lag alerts |

**CloudBuilder Recommendation**: The Provision Engine should buffer deployment events locally (Go channel buffer → disk spill). Backend accepts events via rate-limited API. Kafka absorbs spikes between engine and Observe/Cost modules.

### 8.3 Multi-Region Data Residency

| Platform | Approach |
|---|---|
| Datadog | Regional intake + storage. Agent configured with region-specific site: endpoint. Cross-region queries via Data Federation |
| New Relic | Cell-based isolation. Cells can be regional. Account-to-region mapping at account creation |
| Grafana | X-Scope-OrgID with per-tenant storage backend configuration. Bucket per tenant per region |
| Dynatrace | Environment-specific deployments. ActiveGate routes to environment-specific Grail instance |

**CloudBuilder Recommendation**: Implement multi-region at the tenant level (Phase 2). Each tenant gets a region assignment at creation. Spring Modulith monolith per region. Cross-region queries via federated query layer (PostgreSQL foreign data wrappers + application-level aggregation).

### 8.4 Cost Attribution

| Platform | Approach |
|---|---|
| Datadog | Per-host + per-index + per-custom-metric billing. Tags-based cost breakdown. Cost Management dashboard |
| Grafana | Per-tenant ingestion samples tracked via cortex metrics. Rate limit overrides per tenant |
| New Relic | Per-account data ingested (GB). Breakdown by data type. Per-account query limits |
| Dynatrace | Per-host consumption. Davis AI identifies waste. Cost optimization recommendations |

**CloudBuilder Recommendation**: The Cost module already tracks per-environment spend. Extend to tiered attribution: (a) per-user (who deployed what), (b) per-project (which canvas generated costs), (c) per-resource-type (compute vs storage vs network). Use OpenCost-compatible labels enforced at canvas-design time.

---
## 9. Ranked Recommendations

### TIER 1 — Immediate (CloudBuilder Q3 2026)

| # | Recommendation | Source | Effort | Impact |
|---|---|---|---|---|
| 1 | **Kafka between write and read paths** for Observe module | All 4 observability platforms | 2-3 sprints | Decouples ingestion from querying. Absorbs spikes. Foundation for all future scaling |
| 2 | **CRDT-based canvas collaboration** via Yjs + WebSocket + Redis Pub/Sub | Miro, Excalidraw | 1-2 sprints | Multi-user canvas editing. Offline support. Undo/redo without round-trips |
| 3 | **Exhaustive indexing for cost/deployment records** | Datadog (Ostrich) | 1 sprint | Enables arbitrary tag-based queries. No re-processing needed |
| 4 | **Provision Engine local buffering** with disk spill | Dynatrace (ActiveGate), Datadog (Agent) | 1 sprint | Prevents backend overload. Enables offline deployments |

### TIER 2 — Medium (CloudBuilder Q4 2026)

| # | Recommendation | Source | Effort | Impact |
|---|---|---|---|---|
| 5 | **Object storage (S3) for Terraform state + canvas snapshots** | Grafana, Datadog, New Relic, Excalidraw | 2 sprints | Single source of truth. Cost-effective RF1. Enables time-travel for canvas versions |
| 6 | **Schema-on-read for Observe module** (JSONB → Parquet) | Dynatrace (Grail) | 3-4 sprints | Schema evolution without migrations. Columnar compression for cost data |
| 7 | **Volatile vs guaranteed message channels** | Excalidraw | 1 sprint | Cursor/selection events not persisted. Node/edge changes persisted via Kafka |

### TIER 3 — Future (CloudBuilder Q1 2027)

| # | Recommendation | Source | Effort | Impact |
|---|---|---|---|---|
| 8 | **Cellular architecture** for tenant isolation | New Relic (10 cells) | 4-6 sprints | Fault isolation. Blast radius limited to one cell. 50ms median query |
| 9 | **Iceberg migration** for long-term data lake | New Relic (NRDB v2) | 4-6 sprints | ACID transactions. Time travel. Standard format (Parquet). Schema evolution |
| 10 | **Multi-region active-active** | Datadog, New Relic | 6-8 sprints | Data residency compliance. Regional failover. <100ms regional latency |

---

## 10. Impact vs Effort Matrix

```
                    HIGH IMPACT
                        |
        TIER 1          |          TIER 1
        (2-3 sprints)   |          (1-2 sprints)
        Kafka decoupling |          CRDT collaboration
        Exhaustive idx   |          Local buffering
                        |
    LOW EFFORT ---------+---------- HIGH EFFORT
                        |
        TIER 2          |          TIER 3
        (2 sprints)     |          (4-8 sprints)
        S3 snapshots    |          Cellular architecture
        Schema-on-read  |          Iceberg migration
        Volatile/guar.  |          Multi-region
                        |
                    LOW IMPACT
```

### Priority Order for CloudBuilder Roadmap

1. **Sprint 31-32** (Immediate): CRDT collaboration (Yjs + WebSocket) + Provision Engine local buffering
2. **Sprint 33-35**: Kafka between write and read paths + exhaustive indexing for cost records
3. **Sprint 36-37**: S3 for Terraform state + canvas snapshots + volatile/guaranteed channels
4. **Sprint 38-40**: Schema-on-read (Parquet) for Observe module
5. **Q1 2027**: Cellular architecture → Iceberg → Multi-region

---

## 11. Immediate / Medium / Long-term Actions

### Immediate (Q3 2026 — Next 2 Sprints)

- [ ] **ADR-034**: Create Architecture Decision Record for Kafka re-integration into Observe module (write/read path decoupling)
- [ ] **ADR-035**: Create Architecture Decision Record for CRDT-based canvas collaboration (Yjs + WebSocket + Redis Pub/Sub)
- [ ] **POC-001**: Prototype Provision Engine local buffering — Go channel buffer with disk spill, configurable batch size and flush interval
- [ ] **POC-002**: Prototype exhaustive indexing for cost records — implement tag extraction at CostService write time, BRIN indexes on PostgreSQL
- [ ] **Sprint 32 deliverable**: Multi-user canvas editing demo (2 concurrent users, basic CRDT sync)

### Medium (Q4 2026)

- [ ] **ADR-036**: Architecture Decision Record for S3 as Terraform state backend + canvas snapshot storage
- [ ] **ADR-037**: Architecture Decision Record for schema-on-read in Observe module (JSONB v1 → Parquet v2)
- [ ] **POC-003**: Kafka integration — provision-engine publishes deployment events to Kafka topic; Observe module consumes and updates dashboards
- [ ] **POC-004**: Volatile vs guaranteed channel separation — Redis Pub/Sub for cursor/selection; Kafka for node/edge changes
- [ ] **Cost module v2**: Per-user, per-project, per-resource-type cost attribution with OpenCost-compatible labels

### Long-term (Q1 2027)

- [ ] **ADR-038**: Architecture Decision Record for cellular architecture — tenant hashing, cell sizing, 90-day lifecycle
- [ ] **ADR-039**: Architecture Decision Record for Iceberg data lake — migration strategy from JSONB to Parquet on S3
- [ ] **ADR-040**: Architecture Decision Record for multi-region — regional endpoints, data residency, federated queries
- [ ] **POC-005**: Iceberg integration — write cost records as Parquet, query with Trino/Presto
- [ ] **POC-006**: Multi-region deployment — active-active with regional PostgreSQL + federated query

---

## 12. Appendices

### Appendix A: Research Sources

| Competitor | Sources Used |
|---|---|
| **Grafana Stack** | Grafana Mimir architecture docs (grafana.com), Tempo 3.0 blog post (grafana.com/blog), Grafana Labs engineering blog (grafana.com/blog), Loki architecture docs, Mimir/Tempo GitHub (grafana/mimir, grafana/tempo) |
| **Datadog** | Datadog Engineering blog (datadoghq.com/blog): "Ostrich: Exhaustive Timeseries Indexing", "Husky: Event Store at Datadog", "Mothra: Distributed Query Engine", "Multi-Region Data Residency", "Cost Management Overview" |
| **Dynatrace** | Dynatrace Engineering blog: "Grail — Dynatrace 3rd Gen Platform", "Davis AI Causal Engine", "Smartscape Topology" |
| **New Relic** | New Relic Engineering blog: "NRDB Architecture", "Cellular Architecture", "Migration to Apache Iceberg", "Query Life of a New Relic NRDB Query" |
| **Miro** | Miro Engineering blog: "How Miro Handles Real-Time Collaboration", "CRDT vs OT", "Scaling WebSocket Connections" |
| **Excalidraw** | Excalidraw GitHub (excalidraw/excalidraw), Excalidraw Collaboration Server docs, Excalidraw Blog: "How Excalidraw Handles Real-Time" |

### Appendix B: Glossary

| Term | Definition |
|---|---|
| **CRDT** | Conflict-free Replicated Data Type — data structure that can be modified concurrently by multiple users without conflict resolution |
| **OT** | Operational Transformation — algorithm for collaborative editing (older approach, requires central server) |
| **WAL** | Write-Ahead Log — append-only log for durability before processing |
| **RF1** | Replication Factor 1 — single copy, no replication (acceptable when durability is provided upstream) |
| **ELT** | Extract, Load, Transform — load raw data first, transform at query time |
| **Cell** | Independent cluster with full pipeline (ingest, store, query) — fault isolation boundary |
| **Kafka** | Distributed event streaming platform — durable, ordered, replayable message bus |

### Appendix C: ADR Impact Mapping

| New ADR | Supersedes | Amends |
|---|---|---|
| ADR-034 (Kafka re-integration) | ADR-015 | ADR-008 (Observability subsystem) |
| ADR-035 (CRDT collaboration) | — | ADR-003 (Design module architecture) |
| ADR-036 (S3 object storage) | — | ADR-005 (Provision engine v1) |
| ADR-037 (Schema-on-read) | — | ADR-008 (Observe module storage) |
| ADR-038 (Cellular architecture) | — | ADR-001 (Multi-tenant architecture) |
| ADR-039 (Iceberg data lake) | ADR-008 (Observe storage) | ADR-011 (Cost module) |
| ADR-040 (Multi-region) | — | ADR-001 (Deployment topology) |

---

## 13. Document Metadata

- **Author**: Principal Architect Agent — FAANg Framework
- **Date**: 2026-06-24
- **Status**: Final
- **Research Method**: Deep web search (6 competitors, 9+ searches), official documentation, engineering blogs
- **Knowledge Tiers Used**: TIER 0 (docs), TIER 1 (engineering blogs), TIER 3 (OSS repos)
- **Next Review**: Q3 2026 or when any competitor publishes significant architecture changes
