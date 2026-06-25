# ADR-019: Multi-Region Logical Replication Strategy

**Status**: Implemented
**Date**: 2026-06-21
**Author**: Principal Architect Agent

## Context

CloudBuilder multiregion module already has 21 backend files with:
- `Region.java` — region definition (name, cloud provider, endpoint, status, health)
- `DisasterRecoveryPlan.java` — DR plan (source region, target region, RPO/RTO, status, last test)
- `DRTestResult.java` — test results (plan id, status, duration, issues)
- `RegionHealth.java` — health metrics (latency, uptime, error rate, cpu, memory)

The module needs to evolve from passive region management to active cross-region data replication and automated failover.

## Problem

How to replicate CloudBuilder data across regions for disaster recovery without adding a distributed database, changing the application architecture, or introducing third-party replication tools?

## Decision

### 1. Hybrid Replication: Logical + Dual-Write

**Chosen**: PostgreSQL logical replication for read-heavy tables + application-level dual-write for critical metadata.

**Alternatives considered**:
- PostgreSQL streaming replication (read-only replicas, failover requires Patroni or repmgr)
- Application-level dual-write for everything (double latency, consistency challenges)
- Third-party tools (Debezium + Kafka — external dependency, operational overhead)
- CockroachDB/YugabyteDB (distributed SQL — database replacement, huge migration)

**Replication Strategy by Data Type**:

| Data Type | Strategy | Rationale |
|-----------|----------|-----------|
| Canvas (designs, nodes, edges) | **Logical replication** | Read-heavy, eventual consistency acceptable |
| Catalog items & marketplace | **Logical replication** | Read-heavy, low write frequency |
| Users, tenants, roles | **Logical replication** | Low write frequency, critical for auth |
| Environments, deployments | **Primary region only** | Write-heavy, strong consistency required |
| Metrics, logs, traces | **Write locally, aggregate globally** | Each region writes to own DB; global views query all |
| Sessions, refresh tokens | **Primary region only** | Short-lived, region-local |

**Rationale**:
1. Logical replication is selective — replicate only specific tables
2. Works across different PostgreSQL versions (primary 16, replica can be 16)
3. Bidirectional possible for active-active (sprint 23+)
4. No application changes needed for replicated tables
5. Primary-region-only for critical writes avoids split-brain

**Consequences**: PostgreSQL configuration change (wal_level = logical, publication/subscription). Logical replication slots require monitoring (can lag under heavy write load).

### 2. Active-Passive Failover

**Chosen**: 1 primary region + N DR regions. Failover is manual-initiated, automated-execution.

**Alternatives considered**:
- Active-active (complex conflict resolution, split-brain risk)
- Fully automatic failover (too dangerous — could cascade)
- Manual-everything (too slow — RTO of hours)

**Failover Flow**:
```
Health check detects primary unhealthy (3 consecutive failures, 10s interval)
  → Alert admin (UI notification + email)
  → Admin evaluates situation
  → Admin clicks "Iniciar Failover" (web UI)
    1. Promote DR database (pg_promote() or ALTER SUBSCRIPTION ... ENABLE)
    2. Update DNS (CNAME to DR region load balancer)
    3. Activate DR region's backend instances
    4. Verify health of promoted region
    5. Log failover event to audit
```

**RTO Target**: < 5 minutes (manual decision) + 2 minutes (automated execution) = ~7 minutes total
**RPO Target**: < 1 second (synchronous commit for critical tables) + eventual for read replicas

**Consequences**: Existing DisasterRecoveryPlan entity supports this flow. DR test scheduled monthly (reuse DRTestResult entity).

### 3. ReplicationConfig Entity (new)

**Chosen**: New JPA entity to track replication relationships.

```java
@Entity
@Table(name = "replication_configs")
public class ReplicationConfig {
    @Id private String id;
    private String sourceRegionId;
    private String targetRegionId;
    private String resourceType;    // DESIGN, CATALOG, IAM, ALL
    private String strategy;        // LOGICAL_REPLICATION, DUAL_WRITE, NONE
    private String status;          // ACTIVE, PAUSED, FAILED, CONFIGURING
    private Instant lastSyncAt;
    private String lagBytes;        // pg_stat_replication replay_lag
}
```

**Rationale**: Configuration-as-data enables UI for replication management. Operators can see replication status, lag, and pause/resume per data type.

## Consequences

1. **1 new entity**: ReplicationConfig.java
2. **1 new service**: ReplicationService.java (monitor lag, pause/resume)
3. **Modified**: DisasterRecoveryService.java — add auto-failover flow
4. **Modified**: RegionHealth entity — add health check aggregation
5. **Frontend**: Region topology view + failover controls in Observe/DR section
6. **Infrastructure**: PostgreSQL logical replication setup script
7. **Zero new application dependencies** — all PostgreSQL native

## References

- Region.java: Existing region entity
- DisasterRecoveryPlan.java: Existing DR plan entity
- DRTestResult.java: Existing DR test entity
- RegionHealth.java: Existing health metrics entity
- DisasterRecoveryService.java: Existing DR service
- ADR-008: Native Observability Architecture (PostgreSQL-native data patterns)
