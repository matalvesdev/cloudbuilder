## 10. Concrete Implementation Plans

### 10.1 ClickHouse Migration Strategy

**Phase 1 — Dual-Write (Weeks 1-2):**
```java
// Extend MetricsDualWriter to write to ClickHouse buffer
public class MetricsDualWriter {
    public void write(MetricPoint point) {
        postgresRepository.save(point);        // existing, keep for rollback
        clickHouseBuffer.offer(point);          // batch write to ClickHouse
    }
}
```

**Phase 2 — Query Redirect (Weeks 3-4):**
- Create ClickHouseReader implementing existing Reader interface (SigNoz pattern)
- Feature flag: `observability.storage.clickhouse=true`
- Read from ClickHouse, still writing to PostgreSQL

**Phase 3 — Cutover (Weeks 5-6):**
- Remove PostgreSQL writes
- TTL retention: `MODIFY TTL toDateTime(timestamp) + INTERVAL 30 DAY`
- S3 tiered storage: HOT (SSD, 7d) → WARM (S3, 30d) → COLD (Glacier, 1y)

**Schema (SigNoz-inspired):**
```sql
-- Time-series metrics (single-table with native ClickHouse JSON)
CREATE TABLE metrics_samples_v1 (
    tenant_id String,
    metric_name String,
    timestamp DateTime64(9),
    tags JSON,  -- subcolumnar access
    value Float64
) ENGINE = MergeTree()
PARTITION BY toDate(timestamp)
ORDER BY (tenant_id, metric_name, timestamp)
TTL toDateTime(timestamp) + INTERVAL 30 DAY;

-- Logs
CREATE TABLE logs_v1 (
    tenant_id String,
    timestamp DateTime64(9),
    level String,
    service_name String,
    message String,
    resource_attributes JSON
) ENGINE = MergeTree()
PARTITION BY toDate(timestamp)
ORDER BY (tenant_id, timestamp)
TTL toDateTime(timestamp) + INTERVAL 90 DAY;

-- Traces
CREATE TABLE traces_v1 (
    tenant_id String,
    trace_id String,
    span_id String,
    parent_span_id String,
    service_name String,
    operation_name String,
    timestamp DateTime64(9),
    duration_ns UInt64,
    status_code String,
    attributes JSON
) ENGINE = MergeTree()
PARTITION BY toDate(timestamp)
ORDER BY (tenant_id, trace_id, timestamp)
TTL toDateTime(timestamp) + INTERVAL 30 DAY;
```

### 10.2 MWMBR SLO Alerts

```java
@Service
public class BurnRateAlertService {
    
    // Tier 1: 14.4x burn rate — 2% budget in 1 hour
    // r_th = 0.02 x 720 / 1 = 14.4, k = 60min / 5min = 12
    
    public BurnRateResult evaluate(SloDefinition slo) {
        Instant now = Instant.now();
        
        // Short window: 5 minutes
        double shortRate = computeErrorRate(slo, now.minus(5, MINUTES), now);
        double shortBurnRate = shortRate / (1 - slo.getTargetPct() / 100.0);
        
        // Long window: 1 hour  
        double longRate = computeErrorRate(slo, now.minus(1, HOURS), now);
        double longBurnRate = longRate / (1 - slo.getTargetPct() / 100.0);
        
        // Alert if both windows exceed threshold
        boolean firing = shortBurnRate > 14.4 && longBurnRate > 14.4;
        
        return new BurnRateResult(slo.getId(), shortBurnRate, longBurnRate, firing);
    }
}
```

**Key Detail — The 14.4x Formula:**

The "magic numbers" are derived mathematically, not empirically:
```
14.4 = (2% of budget) x (720h compliance) / (1h window) = 0.02 x 720 / 1
6    = (5% of budget) x (720h compliance) / (6h window) = 0.05 x 720 / 6
```

These are **SLO-independent** — same for 99%, 99.9%, 99.99%. Only the absolute error rate changes.

### 10.3 Dynamic Sampling (Honeycomb-Adapted)

```java
@Component
public class EMADynamicSampler {
    private final ConcurrentHashMap<String, AtomicLong> counts = new ConcurrentHashMap<>();
    private final double alpha = 0.125; // EMA decay
    private final int targetRate = 50;  // 1/50 traces
    
    public boolean shouldSample(String key) {
        long count = counts.computeIfAbsent(key, k -> new AtomicLong(0))
                          .incrementAndGet();
        
        // Rare keys (low count) → higher sampling rate
        double rate = Math.min(1.0, Math.sqrt(targetRate / (double) count));
        
        // Update EMA every 100 observations
        if (count % 100 == 0) {
            counts.get(key).set((long)(count * (1 - alpha)));
        }
        
        return ThreadLocalRandom.current().nextDouble() < rate;
    }
}
```

### 10.4 Anomaly Detection (Holt-Winters)

```java
@Service
public class HoltWintersAnomalyDetector {
    // Triple Exponential Smoothing with seasonality
    
    public AnomalyResult detect(String metricName, double actual, Instant now) {
        Model model = loadModel(metricName);
        double predicted = model.forecast(now);
        double residual = actual - predicted;
        double stdDev = model.getStdDev(); // 7-day trailing
        
        boolean anomalous = Math.abs(residual) > 3 * stdDev;
        model.update(actual, now);
        saveModel(metricName, model);
        
        return new AnomalyResult(anomalous, predicted, actual, residual / stdDev);
    }
}
```

---

## 11. References

### Engineering Blogs
- [Datadog Monocle: Rust Timeseries Engine](https://www.datadoghq.com/blog/engineering/rust-timeseries-engine/) (2025)
- [Datadog Timeseries Indexing at Scale](https://www.datadoghq.com/blog/engineering/timeseries-indexing-at-scale/) (2024)
- [Datadog Husky: 3rd-gen Event Store](https://www.datadoghq.com/blog/engineering/introducing-husky/) (2022)
- [Datadog Agent Metrics Pipeline Optimizations](https://www.datadoghq.com/blog/engineering/performance-improvements-in-the-datadog-agent-metrics-pipeline/) (2023)
- [Google SRE Workbook — Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/)
- [Grafana Loki Architecture](https://grafana.com/docs/loki/latest/get-started/architecture/)
- [Honeycomb Refinery 3.0 Sampling](https://www.honeycomb.io/blog/enhancements-honeycomb-telemetry-pipeline-deliver-greater-visibility) (2025)
- [SigNoz Architecture](https://signoz.io/docs/architecture/)
- [Dynatrace Davis AI Preventive Operations](https://www.dynatrace.com/news/blog/advancing-aiops-preventive-operations-powered-by-davis-ai/) (2025)
- [New Relic Predictive Alerting GA](https://docs.newrelic.com/whats-new/2025/07/whats-new-7-22-predictive-analytics/) (2025)

### Research Papers
- [Deriving the Magic Numbers: MWMBR Math](https://blog.joshdow.ca/deriving-the-magic-sre-numbers/) (2025)
- [DDSketch: Fast Fully Mergeable Quantile Sketch](https://www.datadoghq.com/blog/engineering/ddsketch/)
- [Sloth: SLO Spec to Prometheus Rules](https://github.com/slok/sloth)
- [Holt-Winters Seasonal Forecasting](https://otexts.com/fpp3/holt-winters.html)

---

## Appendix A: CloudBuilder Observability Inventory

| Module | Backend Files | Frontend Files | Tables | APIs | Maturity |
|--------|--------------|----------------|--------|------|----------|
| observability/ | 66 Java | 11 TSX | 12+ JPA | 15+ REST | Functional |
| observe/ (legacy) | 16 Java | — | 2 tables | 6 APIs | Transitioning |
| shared/monitoring/ | 6 Java | — | — | Micrometer | Production |
| apm/ | 5 Java | — | DTOs | 1 controller | Partial |
| metrics/ | 8 Java | — | DTOs | 1 controller | Partial |

**Total: ~101 Java files, ~11 React components, 12+ database tables**

---

## Appendix B: Migration Risk Matrix

| Migration | Risk | Mitigation | Rollback |
|-----------|------|------------|----------|
| PG → ClickHouse | Data loss | Dual-write 2 weeks | Feature flag to PG |
| Head-based sampling | Incomplete traces | Error sampler keeps critical | 100% fallback |
| MWMBR alerts | False positives | AND-gate design | Threshold tuning |
| RUM SDK | Bundle size | Lazy load, tree-shake | Feature flag |

---

## Appendix C: SloService Bug Fix

**Current (wrong):**
```java
double errorBudgetPct = slo.getTargetPct() > 0
    ? Math.max(0, (sliPct / slo.getTargetPct()) * 100.0)
    : 100.0;
```

**Corrected formula:**
```java
// errorBudgetRemaining = how much of allowed error is left
// sliPct=99.5, targetPct=99.9
// errorRate = 0.5%, allowedError = 0.1%
// budgetConsumed = 0.5/0.1 = 500% (over budget)
double errorRate = 100.0 - sliPct;
double allowedError = 100.0 - slo.getTargetPct();
double budgetRemaining = allowedError > 0
    ? Math.max(0, (1 - errorRate / allowedError) * 100.0)
    : 100.
