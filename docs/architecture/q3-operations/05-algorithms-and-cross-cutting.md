## 5. Anomaly Detection Algorithm

### 5.1 Candidate Approaches

| Approach | Description | Strengths | Weaknesses |
|----------|-------------|-----------|------------|
| Z-Score | Flag points > 3σ from rolling mean | Simple, interpretable | Fails on trends, assumes normal distribution |
| Moving Average (SMA) | Compare actual vs 7/30-day rolling avg | Seasonality handling, cheap | Lag in detection, threshold tuning |
| EWMA | Weighted avg with decay | Fast adaptation | Alpha tuning, over-sensitive |
| Isolation Forest | ML ensemble detector | No distribution assumptions | Overkill, needs training data |
| Custom Composite | Z-score + trend-adjusted baseline | Best of both worlds | More complex implementation |

### 5.2 Decision: Custom Composite

**Reasons**: Cost data is not normally distributed (weekday/weekend patterns). Pure Z-score over-flags. Moving average lags on spikes. ML is overengineered for <100K records/month.

### 5.3 Algorithm

```
For each service S, for each day D in last 90 days:

1. BASELINE
   short_avg = avg of last 7 days (excl D)
   long_avg  = avg of last 30 days (excl D)
   baseline = 0.3 * short_avg + 0.7 * long_avg

2. SEASONAL ADJUSTMENT
   For each day-of-week, compute historical ratio vs overall avg
   adjusted_baseline = baseline * day_of_week_factor

3. DEVIATION
   residual = actual - adjusted_baseline
   rolling_std = stddev of residuals over last 30 days
   z_score = residual / rolling_std (if rolling_std > min_threshold)

4. CLASSIFY
   |z| > 5.0 AND residual > $100  → SPIKE (HIGH)
   |z| > 3.0 AND residual > $50   → ANOMALY (MEDIUM)
   |z| > 2.5 AND 3+ consecutive   → UPWARD/DOWNWARD TREND (MEDIUM)
   |z| > 2.0 AND residual < $20   → ignore (noise)
   Otherwise                       → NORMAL
```

### 5.4 Threshold Constants

```java
private static final double SPIKE_Z = 5.0;
private static final double SPIKE_MIN_AMOUNT = 100.0;
private static final double ANOMALY_Z = 3.0;
private static final double ANOMALY_MIN_AMOUNT = 50.0;
private static final double TREND_Z = 2.5;
private static final int TREND_CONSECUTIVE = 3;
```

### 5.5 Expected False Positive Rate: < 5%
Monitor in production. Adjust thresholds per service if some services have more volatile cost patterns.

---

## 6. Compliance Rules Engine - Detailed Design

### 6.1 Strategy Pattern

```java
public interface ComplianceRuleStrategy {
    ComplianceCheckResult evaluate(ComplianceRule rule, String tenantId);
    String getRuleType(); // e.g., "AUDIT_TRAIL"
}

@Component
public class AuditTrailRuleStrategy implements ComplianceRuleStrategy {
    @Override
    public String getRuleType() { return "AUDIT_TRAIL"; }

    @Override
    public ComplianceCheckResult evaluate(ComplianceRule rule, String tenantId) {
        // Parse configJson for maxGapHours, criticalActions
        // Query audit_events for gaps > maxGapHours
        // Check critical actions are all logged
        // Return PASS/FAIL with evidence
    }
}
```

### 6.2 Registration
Strategies are auto-discovered via Spring component scanning. ComplianceService injects `List<ComplianceRuleStrategy>` and builds a Map<ruleType, strategy>.

### 6.3 Configurable Rules

Rules are stored in compliance_rules with configJson:
```json
{
    "ruleType": "AUDIT_TRAIL",
    "config": { "maxGapHours": 24, "criticalActions": ["DELETE", "ROLE_CHANGE"] }
}
```

---

## 7. Budget Alert Flow

### 7.1 Complete Flow

```
Cron (06:00 daily)
  │
  ▼
BudgetAlertService.evaluateAllBudgets()
  │
  ├─► For each ACTIVE budget:
  │     ├─► Query cost_records: SUM(amount) WHERE date IN budget period
  │     ├─► usagePercent = spent / limit * 100
  │     ├─► usagePercent >= 100% → CRITICAL
  │     ├─► usagePercent >= 90%  → CRITICAL
  │     ├─► usagePercent >= 80%  → WARNING
  │     └─► else → OK (no action)
  │
  ├─► If breached:
  │     ├─► Publish BudgetThresholdBreachedEvent (Modulith event)
  │     │     ├─► Observe listener: create Incident
  │     │     │     └─► NotificationService: EMAIL/SLACK/WEBHOOK
  │     │     └─► Audit listener: record AuditEvent
  │     └─► Update budget status if needed
  │
  └─► If previously breached but now OK:
        └─► Auto-resolve existing incident
```

### 7.2 Deduplication
- One OPEN incident per budget at a time (same partial unique index pattern)
- If budget goes WARNING→CRITICAL: update existing incident severity
- If budget goes WARNING→OK: auto-resolve incident

---

## 8. Partitioning Strategy

### 8.1 PostgreSQL Native Range Partitioning

**Decision**: Use PostgreSQL native partitioning on timestamp columns.

**Rationale**: Partition pruning for time-range queries (most common pattern). Can DETACH+DROP old partitions. PostgreSQL 16 has mature support. Same DB — no new dependencies.

### 8.2 Partition Scheme

```sql
-- audit_events (Sprint 11)
CREATE TABLE audit_events (
    id VARCHAR(36) NOT NULL,
    tenant_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    action VARCHAR(32) NOT NULL,
    resource_type VARCHAR(64),
    resource_id VARCHAR(64),
    details TEXT,
    ip_address VARCHAR(45),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (timestamp, id)
) PARTITION BY RANGE (timestamp);

-- Monthly partitions
CREATE TABLE audit_events_2026_06 PARTITION OF audit_events
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE audit_events_2026_07 PARTITION OF audit_events
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

-- Index for filtered queries
CREATE INDEX idx_audit_tenant_action ON audit_events (tenant_id, action, timestamp DESC);
```

```sql
-- cost_records (Sprint 10)
CREATE TABLE cost_records (
    id VARCHAR(36) NOT NULL,
    environment_id VARCHAR(64) NOT NULL,
    provider VARCHAR(16) NOT NULL,
    service_name VARCHAR(64) NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    currency VARCHAR(8) NOT NULL,
    date DATE NOT NULL,
    -- other columns...
    PRIMARY KEY (date, id)
) PARTITION BY RANGE (date);
```

### 8.3 PartitionManager

```java
@Component
public class PartitionManager {
    @Scheduled(cron = "0 0 0 1 * ?") // 1st of each month
    public void createNextPartitions() {
        // For each partitioned table, create partitions for next 3 months
        // CREATE TABLE IF NOT EXISTS tablename_YYYY_MM
        //   PARTITION OF tablename
        //   FOR VALUES FROM ('YYYY-MM-01') TO ('YYYY-MM+1-01')
    }
}
```

### 8.4 DataArchivalService

```java
@Service
public class DataArchivalService {
    @Scheduled(cron = "0 0 2 * * ?") // daily 2 AM
    public void archiveOldPartitions() {
        // For data > 12 months:
        // ALTER TABLE ... DETACH PARTITION
        // Dump to CSV/Parquet
        // DROP PARTITION
    }
}
```

### 8.5 Tables Requiring Partitioning

| Table | Key | Granularity | Retention | Query Pattern |
|-------|-----|------------|-----------|---------------|
| audit_events | timestamp | Monthly | 12 mo | tenant + action + date range |
| cost_records | date | Monthly | 24 mo | aggregate by month/service |
| cost_anomalies | detected_at | Monthly | 12 mo | recent anomalies |
| compliance_checks | checked_at | Monthly | 6 mo | latest by rule |
| metrics_ts | timestamp | Monthly | 6 mo | range + aggregation |
| traces | start_time | Monthly | 6 mo | tenant + error + time |
| logs | timestamp | Monthly | 3 mo | tenant + level + time |

### 8.6 Migration Strategy for Existing Tables

For existing tables (audit_events, cost_records):
1. Rename old table: audit_events → audit_events_old
2. Create new partitioned table
3. INSERT INTO audit_events SELECT * FROM audit_events_old
4. DROP audit_events_old

---

## 9. Cross-Cutting Concerns

### 9.1 Tenant Isolation
All new entities include `tenantId` with `@Column(nullable = false)`. TenantFilter automatically appends WHERE tenant_id = :tenantId.

### 9.2 Audit Logging Requirements

| Service | Actions to Audit |
|---------|-----------------|
| AlertRuleService | CREATE, UPDATE, DELETE, TOGGLE |
| IncidentService | CREATE, ACKNOWLEDGE, RESOLVE |
| SloService | CREATE_SLO, UPDATE_SLO, DELETE_SLO |
