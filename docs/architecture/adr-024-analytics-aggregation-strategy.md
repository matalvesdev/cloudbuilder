# ADR-024: Analytics Aggregation Strategy — Scheduled Rollups + Caffeine Cache

**Status**: Implemented (with bugs)
**Date**: 2026-06-21
**Author**: Backend Agent

## Context

The Analytics module (`com.cloudbuilder.analytics`) tracks user events via the `AnalyticsEvent` entity and `AnalyticsEventRepository`. Each event is stored as a single row in the `analytics_events` table.

Currently:
- Events are written individually on each user action (canvas save, deploy, cost optimization, etc.)
- Dashboard queries use `COUNT` and `GROUP BY` directly on the raw events table
- The controller exposes `/usage/{tenantId}`, `/activity/{tenantId}`, and `/events/{tenantId}` endpoints that query live data
- There is **no rollup, pre-aggregation, or caching strategy**

### Growth Projections

| Metric | Current | 6 months | 12 months |
|--------|---------|----------|-----------|
| Users | ~10 (dev) | ~500 | ~5,000 |
| Events/user/day | ~50 | ~100 | ~200 |
| Daily events | ~500 | ~50,000 | ~1,000,000 |
| Monthly events | ~15K | ~1.5M | ~30M |

At 30M events/month, querying the raw events table for dashboard aggregation will become prohibitively slow, even with proper indexing.

## Problem

How to maintain sub-second dashboard query performance as the event volume grows from thousands to millions of rows per month, without requiring external infrastructure (Elasticsearch, ClickHouse, etc.)?

## Decision

### 1. Nightly @Scheduled Rollup into Partitioned Monthly Tables

**Chosen**: A Spring `@Scheduled` task runs nightly (00:30 UTC) to aggregate raw events into pre-computed rollup tables, partitioned by month.

**Rollup tables**:

```sql
-- Daily module usage
CREATE TABLE analytics_rollup_daily (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    event_count BIGINT NOT NULL DEFAULT 0,
    unique_users BIGINT NOT NULL DEFAULT 0,
    rollup_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, module, action, rollup_date)
);

-- Monthly module usage (reference for dashboard)
CREATE TABLE analytics_rollup_monthly (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    event_count BIGINT NOT NULL DEFAULT 0,
    unique_users BIGINT NOT NULL DEFAULT 0,
    rollup_month DATE NOT NULL,  -- First day of month
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, module, action, rollup_month)
);

-- User activity rollup
CREATE TABLE analytics_user_rollup_daily (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    module VARCHAR(50) NOT NULL,
    event_count BIGINT NOT NULL DEFAULT 0,
    rollup_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, user_id, module, rollup_date)
);
```

**Partitioning by month** (using PostgreSQL partitioning):

```sql
CREATE TABLE analytics_events_partitioned (
    LIKE analytics_events INCLUDING ALL,
    event_month DATE NOT NULL DEFAULT DATE_TRUNC('month', timestamp)
) PARTITION BY RANGE (timestamp);

CREATE TABLE analytics_events_2026_06 PARTITION OF analytics_events_partitioned
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

CREATE TABLE analytics_events_2026_07 PARTITION OF analytics_events_partitioned
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
```

### 2. Caffeine Cache for Dashboard Queries

Dashboard queries (module usage, user activity, event counts) are cached with **Caffeine** (already in the project replacing Redis):

```java
@Configuration
public class AnalyticsCacheConfig {
    @Bean
    public Cache<String, Map<String, Long>> moduleUsageCache() {
        return Caffeine.newBuilder()
                .expireAfterWrite(5, TimeUnit.MINUTES)
                .maximumSize(100)
                .build();
    }
}
```

Cache keys follow the pattern: `{tenantId}:{queryType}:{params}`
- `tenant-abc:module-usage:30` → module usage for tenant abc, last 30 days
- `tenant-abc:user-activity:7` → user activity for tenant abc, last 7 days

Cache is invalidated when:
- A new event is tracked (via event listener)
- The nightly rollup completes (via scheduler event)

### 3. AggregationService

New domain service to encapsulate aggregation logic:

```
analytics/domain/service/
├── AnalyticsService.java       (existing)
├── AggregationService.java     (new)
```

```java
@Service
public class AggregationService {
    private final AnalyticsEventRepository eventRepository;
    private final AnalyticsRollupRepository rollupRepository;

    @Scheduled(cron = "0 30 0 * * *")  // Every night at 00:30 UTC
    @Transactional
    public void aggregateDaily() {
        var yesterday = LocalDate.now().minusDays(1);
        // 1. Aggregate module usage by day
        // 2. Aggregate user activity by day
        // 3. Update monthly rollups
        // 4. Invalidate relevant caches
    }

    public Map<String, Long> getCachedModuleUsage(String tenantId, int days) {
        var cacheKey = tenantId + ":module-usage:" + days;
        return moduleUsageCache.get(cacheKey, k -> {
            if (days <= 1) {
                // For < 1 day, query raw events (too recent for rollup)
                return analyticsService.getModuleUsage(tenantId, days);
            }
            // For > 1 day, query rollup tables
            return rollupRepository.sumModuleUsage(tenantId, days);
        });
    }
}
```

### 4. Dashboard Query Flow

```
Dashboard Request
  → Check Caffeine cache
    → Cache HIT: return cached rollup
    → Cache MISS:
      → Time range ≤ 1 day: query raw events table (live data)
      → Time range > 1 day: query rollup tables (pre-aggregated)
        → If rollup missing (e.g., today's partial data): supplement with raw events
    → Populate cache
    → Return result
```

## Alternatives Considered

| Alternative | Pros | Cons |
|-------------|------|------|
| **Query raw events always** | Simplest; always fresh | Unbounded query time; requires Elasticsearch for scale |
| **TimescaleDB (hypertables)** | Automatic partitioning, continuous aggregates | New database dependency; operational overhead |
| **Elasticsearch/OpenSearch** | Full-text search + aggregations | Heavy JVM dependency; 2GB+ RAM; operational burden |
| **ClickHouse** | Columnar, 10-100x faster aggregations | New technology; not PostgreSQL-compatible; separate connection pool |
| **Materialized views** | Native PostgreSQL | No incremental refresh; full rebuild each time |
| **Nightly rollups + Caffeine** | Zero new infra; uses existing Caffeine; simple | Up to 24h staleness for aggregate data |

## Trade-offs

- **Freshness vs. performance**: Nightly rollups mean dashboard data is up to 24 hours stale for aggregate views. For the dashboard use case (trends, module comparison, user activity), this is acceptable. The raw event API remains available for real-time debugging.
- **Rollup complexity**: The aggregation logic adds ~100 lines of scheduled task code. In exchange, dashboard queries (which are the most frequently called analytics endpoints) stay sub-second indefinitely.
- **Storage cost**: Rollup tables add ~1% additional storage compared to raw events but reduce query time by 99% for common dashboard queries.

## Consequences

1. **New**: `AggregationService.java` with `@Scheduled(cron = "0 30 0 * * *")` nightly method
2. **New**: `AnalyticsRollupRepository.java` (Spring Data JPA) for rollup tables
3. **New**: `AnalyticsRollupDaily` and `AnalyticsRollupMonthly` entity classes
4. **New**: `AnalyticsCacheConfig.java` with Caffeine cache beans (if not yet existing)
5. **Modified**: `AnalyticsService` or new `AggregationService` — dashboard queries check cache first
6. **Database migration**: Flyway migration for rollup tables + table partitioning
7. **Scheduled task**: Enabled by `@EnableScheduling` in `AnalyticsConfiguration.java`
8. **No new infrastructure**: Rollups use the existing PostgreSQL database

## References

- AnalyticsEvent.java: Current raw event entity
- AnalyticsEventRepository.java: Current repository with COUNT/GROUP BY queries
- Caffeine Cache: https://github.com/ben-manes/caffeine
- PostgreSQL Partitioning: https://www.postgresql.org/docs/16/ddl-partitioning.html
- Flyway: https://flywaydb.org/
- ADR-008: Native Observability (caching strategy conventions)
