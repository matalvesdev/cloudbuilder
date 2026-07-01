# CloudBuilder — Observability Competitor Deep-Dive Analysis

> **Document Type:** Technical Architecture Research  
> **Status:** Complete  
> **Date:** 2026-06-24  
> **Author:** Observability Agent (FAANg)  
> **Competitors Analyzed:** Datadog, Grafana Labs, Dynatrace, New Relic, AWS CloudWatch, Honeycomb, SigNoz

---

## Executive Summary

| Pillar | Market Leader | CloudBuilder Gap | Impact |
|--------|--------------|-----------------|--------|
| Metrics Ingestion | Datadog (Monocle/Rust) | PostgreSQL-based, no sampling | HIGH |
| Distributed Tracing | Datadog/Honeycomb | Basic traces, no sampling | HIGH |
| Log Management | Grafana Loki | PostgreSQL, no compression | HIGH |
| Alerting | New Relic (NRQL) | Threshold-only, no anomaly | MEDIUM |
| Dashboards | Grafana | Static views, no ad-hoc | MEDIUM |
| SLO/SLI | Google SRE pattern | Basic snapshots, no burn-rate | HIGH |
| RUM | Datadog | Not implemented | HIGH |
| AI/ML | Dynatrace Davis AI | Not implemented | HIGH |

---

## 1. Metrics Ingestion & Storage Architecture

### 1.1 Datadog — Monocle Engine (Best in Class)

**Architecture:**
- **Monocle** (2025): Rust-based, shard-per-core, LSM-tree storage engine
- **Two-layer separation**: Index Database (RocksDB, inverted index) + Real-Time Database (Monocle)
- **Ingestion pipeline**: Agent → Kafka → Storage Router → RTDB Nodes (sharded by hash)

**Key Techniques:**
1. **Inverted Index for Tags**: Each tag value maps to timeseries IDs. Tag filtering = set intersection/union.
2. **Context Key Hashing**: 64-bit hash of (namespace, name, sorted_tags) via FNV-1a. XOR-based tag combination.
3. **Shard-per-Core Model**: 16 shards/node, each with own LSM-tree. Zero cross-thread sync on writes.
4. **DDSketch**: Approximate histogram, fixed storage, relative error guarantees.
5. **Time-Based Pruning**: 10-min window files; 99% of queries hit recent data.

### 1.2 SigNoz — ClickHouse-Backed

**Architecture:** OTel Collector → ClickHouse distributed tables. 
**Key:** Single-table metrics store with native JSON subcolumns (v4 schema), TTL retention, 50% less resource vs Elastic.

### 1.3 Honeycomb — High-Cardinality Native

**Architecture:** Custom column store, no pre-aggregation, query-time aggregation.
**Key:** BubbleUp auto-correlation, sample rate correction on ALL queries.

### 1.4 What CloudBuilder Has

- MetricsTsEntity (PostgreSQL), MetricsService (SUM/AVG aggregation), MetricsDualWriter, Micrometer integration

### 1.5 What's Missing — **P0 Critical**

| Feature | Technique | Reference |
|---------|-----------|-----------|
| High-cardinality tag indexing | Inverted index on metric tags | Datadog (2024) |
| Approximate histograms | DDSketch or HDR Histogram | Datadog DDSketch |
| Sampling at ingestion | Dynamic sampling by cardinality | Honeycomb Refinery |
| Columnar storage | Migrate to ClickHouse | SigNoz architecture |
| 64-bit context key hashing | FNV-1a hash of (name, sorted tags) | Datadog Agent perf |

---

## 2. Distributed Tracing

### 2.1 Datadog — Head-Based + Retention Filters

**Strategy:** Head-based at 10 traces/sec per Agent. Adaptive sampling within monthly budget. 
**Error Sampler:** 10 error traces/sec extra (all combinations of env/service/operation/status).
**Rare Sampler:** Diverse traces by unique tag combinations.
**Retention Filters:** Tag-based tail decisioning for 15-day storage.

### 2.2 Honeycomb — Refinery (Tail-Based)

**EMA Dynamic Sampler:** Exponential Moving Average per key. Rare keys sampled higher, frequent lower.
**Rules:** 100% errors, dynamic for rest.
**Innovation:** Sample rate correction — all metrics multiplied by 1/sample_rate. Unique in industry.

### 2.3 What CloudBuilder Has

TraceEntity/SpanEntity, TraceService, TraceInterceptor (AOP), TraceController, TraceExplorer (frontend)

### 2.4 What's Missing — **P1 High**

| Feature | Technique | Reference |
|---------|-----------|-----------|
| Head-based sampling | Priority propagation via W3C TraceContext | Datadog |
| Tail-based sampling | EMA dynamic sampler | Honeycomb Refinery 3.0 |
| Sample rate correction | Multiply count/sum by 1/sample_rate | Honeycomb (2016) |
| Error tracer sampler | 10 error traces/sec per error type | Datadog Agent |
| Live search window | 15-min rolling span buffer | Datadog |

---

## 3. Log Management

### 3.1 Grafana Loki — Label-Based (Best Cost)

**Architecture:** Labels → stream → compressed chunks → object store.
**No full-text indexing.** Index only metadata labels. TSDB blocks for index.

### 3.2 Datadog Husky

Writer → blob storage → Compactor → Reader. Fully stateless, FoundationDB for metadata.

### 3.3 What CloudBuilder Has

LogEntryEntity (PostgreSQL), LogService (JPQL search), PostgresLogAppender, LogViewer (frontend)

### 3.4 What's Missing — **P0 Critical**

| Feature | Technique | Reference |
|---------|-----------|-----------|
| Columnar log storage | Migrate to ClickHouse or Loki | SigNoz/Loki |
| Label-based indexing | Index metadata only, not content | Grafana Loki |
| Chunk compression | Zstd/Snappy batching | Loki chunk format |
| Object store backend | S3/GCS for log chunks | Loki/Husky |
| Retention tiers | Hot (SSD 7d) → Warm (S3 30d) → Cold (Glacier 1y) | Loki tiering |

---

## 4. Alerting Systems

### 4.1 New Relic — NRQL (Best Flexibility)

Anomaly detection with automatic seasonality. Predictive alerting via Holt-Winters (GA 2025).
Multi-signal: 20,000 signals under one FACET condition.
Outlier Detection: DBSCAN-based peer comparison (Preview 2025).

### 4.2 Dynatrace Davis AI

Causal AI correlating anomalies across topology. 99.9% noise reduction. 3-min analysis window.

### 4.3 Google SRE — MWMBR (Gold Standard)

Tiers: 14.4x/1h+5min (2% budget), 6x/6h+30min (5%), 3x/3d+6h (10%).
AND-gate: short window = fast detection + 5min recovery. Long window = noise suppression.

### 4.4 What CloudBuilder Has

AlertRuleEntity, AlertRuleEvaluationEntity, AlertEvaluationService, NotificationChannelEntity, IncidentEntity, frontend views.

### 4.5 What's Missing — **P2 Medium**

| Feature | Technique | Reference |
|---------|-----------|-----------|
| Anomaly detection | Holt-Winters seasonal forecasting | New Relic Predictive |
| MWMBR burn-rate alerts | 14.4x/6x/3x tiers | Google SRE Workbook |
| Multi-signal conditions | FACET over 1K+ signals | New Relic NRQL |
| Alert correlation | Causal topology dedup | Dynatrace Davis |
| Outlier peer detection | DBSCAN | New Relic Outlier |

---

## 5. Dashboarding

### 5.1 Grafana (Standard)

Dynamic templating ($env, $service), ad-hoc Explore mode, cross-datasource queries, JSON provisioning.

### 5.2 What CloudBuilder Has

DashboardEntity (PostgreSQL), DashboardService (CRUD), MetricsDashboard (frontend), ServiceMapView, ScorecardView.

### 5.3 What's Missing — **P2 Medium**

Template variables, ad-hoc query mode, dashboard provisioning (GitOps), library panels, cross-datasource queries, notebooks.

---

## 6. SLO/SLI Tracking

### 6.1 Google SRE Pattern (Industry Standard)

**Burn Rate Math:**
```
r_th = (p / 100) x T / w
T = 720h (30 days), k = w_long / w_short = 12
Tier 1: 14.4x = 0.02 x 720 / 1,  w_short = 60/12 = 5min
Tier 2: 6x    = 0.05 x 720 / 6,  w_short = 360/12 = 30min
```

These numbers are SLO-independent — same multipliers for 99%, 99.9%, 99.99%.

### 6.2 What CloudBuilder Has

SloDefinitionEntity (targetPct, windowDays), SloSnapshotEntity (goodCount, totalCount, sliPct, errorBudgetPct), SloService (hourly snapshots), SloDashboard (frontend cards).

### 6.3 What's Missing — **P0 Critical**

| Feature | Technique | Reference |
|---------|-----------|-----------|
| MWMBR alerting | 14.4x/1h+5min, 6x/6h+30min | Google SRE Workbook |
| Real-time burn rate | From metrics stream (not hourly) | Google Cloud Monitoring |
| Multiple SLI types | Availability, latency, throughput | Datadog SLOs |
| Error budget policy engine | Release gates at 25%/50% | Google SRE |
| SLO correction | Exclude planned downtime | Datadog |

**BUG:** SloService line 57 computes `errorBudgetPct = (sliPct / targetPct) * 100`. **Wrong.** Correc
