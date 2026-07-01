# Cross-Cutting Technology Stack Analysis

> **CTO Agent - FAANg Tech Lead**  
> *Research conducted: June 24, 2026*  
> *Covers: Datadog, Grafana Labs, Dynatrace, New Relic, Miro, Excalidraw*

---

## Executive Summary

This document presents a comprehensive analysis of the technology stacks, architectural patterns, operational models, and lessons learned from six major competitors in the observability and collaboration spaces. The analysis is structured to inform CloudBuilder technology decisions.

**Key findings:**
1. **Storage is the dominant cost** - All observability platforms have moved to object storage (S3/GCS) as the long-term backend, with Kafka as the ingestion buffer
2. **Rust is winning for performance-critical paths** - Datadog rewrote their timeseries engine in Rust; Grafana Mimir/Loki/Tempo are in Go
3. **Cell-based architecture is the new standard** - New Relic and Datadog both adopted cell isolation for multi-tenant fault tolerance
4. **CRDTs (specifically Yjs) dominate real-time collaboration** - Both Miro and Excalidraw ecosystems use CRDT-based approaches
5. **Open-core is viable but requires discipline** - Grafana Labs proves open-core can work at $400M+ ARR
6. **Single-binary deployment matters** - Grafana compiled single-binary approach (Go) dramatically simplifies operations


## Part 1: Technology Stack Comparison

### 1.1 Grafana Labs

#### Architecture Overview

| Component | Language | Storage | Key Pattern |
|-----------|----------|---------|-------------|
| Grafana (Dashboarding) | TypeScript/Go | PostgreSQL (metadata) | Plugin architecture, 160+ datasource plugins |
| Mimir (Metrics) | Go | S3/GCS/Azure + Kafka (ingest) | Prometheus TSDB format, split-and-merge compaction |
| Loki (Logs) | Go | S3/GCS/Azure (single store) | Index-free, label-based, TSDB index (v2.8+) |
| Tempo (Traces) | Go | S3/GCS/Azure + Parquet format | TraceQL, Kafka-based ingest in v3.0 |

#### Mimir Deep Architecture

Two deployment modes:

**Classic Architecture (pre-3.0):**
Distributors send data to stateful Ingesters with local WAL. Ingesters participate in both read and write paths. Heavy queries can disrupt live writes.

**Ingest Storage Architecture (3.0+, preferred):**
- Kafka decouples read and write paths completely
- Distributors write to Kafka (write path)
- Ingesters consume from Kafka (read path) - now effectively stateless
- Block-builders flush Parquet blocks to object storage
- Compactors merge blocks with split-and-merge algorithm

Key innovations:
- Split-and-merge compaction: Breaks compaction into shards to avoid TSDB index limitations
- WarpStream integration: Kafka-compatible streaming built on S3, eliminating inter-AZ networking costs
- Per-tenant TSDB isolation: Each tenant gets their own TSDB blocks

#### Loki Architecture

Index-free architecture (vs Elasticsearch):
- Only indexes labels (like Prometheus), not log content
- Log data compressed and stored in chunks in object storage
- Index formats: BoltDB (deprecated) -> TSDB (recommended, v2.8+)
- Single store = one object store for both index and chunks
- 10-30x cheaper than ELK at scale

Read path: Query Frontend -> sub-queries -> Queriers -> Ingesters (in-memory) + Object Storage

#### Tempo Architecture (v3.0)

Distributor -> Kafka -> Block-builders -> Object Storage (Parquet format)
TraceQL - purpose-built trace query language
Metrics-generator derives RED metrics from traces

#### Business Model: Open Core

Grafana OSS: AGPLv3 | Grafana Enterprise: Commercial | Grafana Cloud: SaaS

- $4$400M+ ARR (2025), 7,000+ customers, 35M+ users
- 1,400+ employees across 40+ countries
- $9B valuation (2026)
- 90% of users will never pay - by design

---

### 1.2 Datadog

#### Architecture Overview

| Component | Language | Storage | Key Pattern |
|-----------|----------|---------|-------------|
| Agent | Go | Local buffer | DogStatsD, 700+ integrations |
| Metrics RTDB | Rust (v6) | Custom LSM-tree on local SSD | Sharded per node, 60x ingest improvement |
| Timeseries Index | Rust | RocksDB (sharded) | Inverted index, 8 shards per 32-core node |
| Events (logs/traces) | Go/Rust | Husky (S3-based) | 3rd-gen event store, FoundationDB metadata |

#### Storage Evolution (6 Generations in 15 years)

1. Gen 1-2: Relational databases - could not handle write throughput
2. Gen 3-4: Custom in-memory + local disk - hit cardinality limits
3. Gen 5: Go-based LSM-tree - improved but single-core bounded
4. Gen 6 (current): Rust-based RTDB - 60x ingest improvement, 5x faster queries

RTDB (Real-Time Database):
- LSM-tree architecture for write-heavy workloads
- Early sharding: each node splits RocksDB into 8 isolated shards (on 32-core nodes)
- Inverted index: always-index timeseries to avoid full scans
- Purpose-built in Rust: CPU operations 6x faster than Go
- Result: 99% reduction in query timeouts, 50% cheaper, 20x higher cardinality

Husky (3rd-gen Event Store):
- Writers read from Kafka, buffer in memory, upload to S3
- FoundationDB as metadata store
- Compactors as distributed LSM-style service on S3
- Trillions of events/day, queries scan 0.6% of data on average
- Adopting Apache Arrow, Parquet, Substrait, DataFusion

#### SaaS-Only Model

- No on-prem option
- Fully regionalized (US1, US3, US5, EU1, etc.)
- All regions completely isolated - no shared control plane
- Estimated 100K+ customers, ~.6B+ revenue

---
### 1.3 Dynatrace

#### Architecture Overview

| Component | Language | Storage | Key Pattern |
|-----------|----------|---------|-------------|
| OneAgent | C++/Java/.NET/Go | Local buffer | Single binary, auto-instrumentation |
| Grail (Data Lakehouse) | Proprietary | S3-based, separated compute/storage | Datawarping, MPP, indexless |
| Davis AI | Proprietary AI | In-memory topology + Grail | Causal + Predictive + Generative AI |
| Smartscape | Proprietary | Graph DB | Auto-discovered dependency mapping |

#### OneAgent Differentiator

- Single binary installed once per host
- Auto-discovers all processes and technologies
- Injects into Java, .NET, Node.js, Go, PHP, Ruby, Python runtimes
- PurePath: Distributed tracing at code level (20 years of innovation)
- Real User Monitoring via JS tag injection
- Claimed <1% CPU overhead per host

#### Davis AI Engine

Hypermodal AI with three modes:
1. Causal AI: Root cause based on topology (not correlation)
2. Predictive AI: Future anomaly prediction from historical patterns
3. Generative AI (Davis CoPilot): Natural language queries

#### Grail Data Lakehouse

- Schema-on-read - no predefined schemas
- Datawarping: patented indexless tech, 90-99% index overhead reduction
- MPP (Massively Parallel Processing): claims 100x performance
- Always-hydrated: no hot/cold storage switching
- Unified: metrics, logs, traces, events, security in one store

---
### 1.4 New Relic

#### Architecture Overview

| Component | Language | Storage | Key Pattern |
|-----------|----------|---------|-------------|
| NRDB | Java + custom | Columnar format on S3 | Cell-based, MPP query |
| Agent | Java/.NET/Python/Go/Ruby/PHP | Local buffer | OpenTelemetry + custom |
| Query Engine | Java | In-memory + S3 | NRQL, 60ms median latency |

#### NRDB Architecture

Unified store for metrics, events, logs, and traces:
- Custom columnar format (archive file format)
- Dictionary, delta, and run-length encoding
- LZ4/Zstd compression
- Schema-less design
- 150 PB/month ingested, 200 PiB stored

Query: Query Router -> Workers (hundreds/thousands) -> S3 data
- Massively parallel query execution
- Bloom filters for data skipping
- 60ms median query latency
- 50B+ events per query

#### Migration: Self-Hosted to SaaS

Before (2019): Single massive Kafka cluster, 800+ services, 1400+ JVMs, hitting physical limits
After (2021+): Cell-based architecture on AWS EKS+MSK
- Each cell = self-contained NRDB instance + own Kafka
- 90-day cell lifecycle (continuous build/decom)
- Tick-Tock methodology: migrate THEN modernize
- 20,000 nodes, 250,000+ k8s pods on AWS
- 100+ cells deployed

---
### 1.5 Miro

| Component | Language | Storage | Key Pattern |
|-----------|----------|---------|-------------|
| Monolith | Java | PostgreSQL, Hazelcast | Stateful session servers |
| WebSocket | Custom (K8s) | - | Stateful connection mgmt |
| Frontend | React (from Backbone.js) | Browser | Custom CRDT sync |

Real-time collaboration:
- Stateful server architecture per board
- Hazelcast for distributed state mapping
- Thread coloring: network + business threads per board
- WebSocket queues: receive/process/persist/broadcast
- 600K+ daily users, 50M+ total

Microservices journey: Monolith (350 servers) -> Docker -> Amazon EKS
- Karpenter + KEDA for auto-scaling
- Graviton instances for cost optimization
- 80% compute cost reduction with EKS

---
### 1.6 Excalidraw

| Component | Language | Storage | Key Pattern |
|-----------|----------|---------|-------------|
| Core Library | TypeScript/React | Browser localStorage | Embeddable npm package |
| App | TypeScript/React | IndexedDB + localStorage | PWA offline support |
| Collab Server | TypeScript/Node.js | Firebase + Socket.IO | E2E encrypted relay |

Simple but effective:
- Two-canvas strategy: StaticCanvas (drawing) + InteractiveCanvas (ephemeral)
- Jotai for atomic state management
- Local-first: localStorage auto-save + IndexedDB for library assets
- Collaboration: Socket.IO with rooms, AES-GCM encryption, 2 broadcast modes
- NO CRDT library - custom relay-based sync with E2E encryption
- Room key in URL fragment (never sent to server)



## Part 2: Integration Patterns

### 2.1 Webhook Patterns

| Platform | Security | Retry | Rate Limiting | Payload |
|----------|----------|-------|---------------|---------|
| Datadog | Basic auth, OAuth 2.0 | 5 retries on 5xx, 15s timeout | Per-webhook queue | Custom JSON |
| Grafana | HMAC signatures, basic auth | Configurable backoff | Instance-level | Custom templated |
| New Relic | API key + HMAC | Exponential 3 retries | Per-account limits | NRQL-based |
| Dynatrace | Token-based, OAuth 2.0 | Configurable retry | Per-problem | Problem context |

Common pattern: POST + JSON + custom headers + signature verification.

### 2.2 Plugin Architectures

Grafana (most mature):
- 3 types: Panel, Datasource, App
- @grafana/data, @grafana/ui, @grafana/runtime SDK
- Plugin Catalog, 160+ datasources

Datadog: 700+ integrations, Agent-based Python checks, API-first

New Relic I/O: 600+ quickstarts, Nerdpack framework, Nr1 CLI

### 2.3 Terraform Providers

Datadog: 100+ resources (broadest). Grafana: 30+. New Relic: 40+. Miro: limited.

### 2.4 API Design

All use REST + URL versioning + OAuth2/API keys. Datadog and New Relic use cursor pagination.

---
## Part 3: Licensing & Business Model

### 3.1 Spectrum

Open Source: Grafana OSS (AGPLv3), Excalidraw (MIT)
Open Core: Grafana Enterprise (AGPL + Commercial)
Proprietary: Datadog, Dynatrace, New Relic

### 3.2 Grafana Open Core Model

Why it works at $4$400M+ ARR:
1. Viral adoption: 35M+ users try OSS first
2. Big tent: 160+ datasources, no lock-in
3. AGPLv3: strategic licensing
4. Cloud = monetization vehicle
5. 90% of users never pay - by design

### 3.3 For CloudBuilder

Strategy: Open core frontend + Proprietary backend + API-first + Terraform provider

---
## Part 4: Operational Costs

### 4.1 Estimated Costs

Mimir at 1M series/sec: ~30-50 nodes + S3 + Kafka = $5$50-100K/month
Loki at 5TB/day: ~10-20 nodes + S3 = $3$300-1,200/month (10-30x cheaper than ELK)
Datadog infra: est. $3$300-500M/year cloud costs

### 4.2 Anti-Patterns to Avoid

Single Kafka cluster -> Multiple clusters with topic routing
Stateful ingesters -> Kafka-backed ingest
Elasticsearch for logs -> Object storage + label index
SaaS-only -> Hybrid model
Monolithic -> Modulith from day one

---
## Part 5: Outages & Lessons

### 5.1 Datadog March 2023

Global: 50-60% nodes down, 48 hours, caused by Ubuntu systemd update.
Lessons: Common infra is global. Graceful degradation matters.

### 5.2 New Relic Migration

Single Kafka cluster -> Cell architecture on AWS EKS.
8 months, 20K nodes, 250K pods to AWS.

### 5.3 Principles for CloudBuilder

1. Kafka as backbone
2. Object storage as source of truth
3. Cell isolation
4. Dogfood
5. Single-binary deploy
6. Read/write path separation
7. Local-first collaboration

---
## Part 6: Technology Recommendations

### 6.1 Stack Validation

React 19 + TS: HIGH (Grafana, Excalidraw, Miro)
Java 21 + Spring: MEDIUM (Miro uses Java)
Go Engine: HIGH (Grafana, Datadog Agent)
PostgreSQL: MEDIUM
Object Storage: HIGH (ALL competitors)
Kafka: HIGH (ALL observability)
Modulith: HIGH (Grafana Go pattern)

### 6.2 Critical Gaps

1. No object storage backend
2. No Kafka for decoupling
3. No cell isolation
4. No OpenTelemetry native

### 6.3 Differentiators

Visual design + Provisioning combined
Platform engineering focus (not general observability)
Built-in documentation generation
$0 infra cost (PostgreSQL + Caffeine replaces 6 services)

---
## References

- Grafana Mimir: grafana.com/docs/mimir/
- Datadog Rust RTDB: datadoghq.com/blog/engineering/rust-timeseries-engine/
- Datadog Husky: datadoghq.com/blog/engineering/introducing-husky/
- Datadog Outage: datadoghq.com/blog/engineering/2023-03-08-deep-dive/
- New Relic NRDB: newrelic.com/resources/white-papers/
- New Relic Migration: newrelic.com/blog/news/new-relics-transition-to-cloud
- Dynatrace Grail: docs.dynatrace.com/docs/platform/grail/
- Excalidraw: excalidraw-excalidraw.mintlify.app/
- Miro Engineering: medium.com/miro-engineering
- Yjs CRDT: github.com/yjs/yjs
- Grafana Labs: grafana.com/licensing/

---
*Generated by CTO Agent (FAANg Tech Lead) - June 24, 2026*
