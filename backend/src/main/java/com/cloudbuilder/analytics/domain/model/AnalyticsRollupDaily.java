package com.cloudbuilder.analytics.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Pre-aggregated daily module usage rollup.
 * Populated nightly by AggregationService.aggregateDaily().
 */
@Entity
@Table(name = "analytics_rollup_daily", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"tenant_id", "module", "action", "rollup_date"})
})
public class AnalyticsRollupDaily {

    @Id
    private String id;

    @Column(name = "tenant_id", nullable = false, length = 64)
    private String tenantId;

    @Column(nullable = false, length = 50)
    private String module;

    @Column(nullable = false, length = 50)
    private String action;

    @Column(name = "event_count", nullable = false)
    private long eventCount;

    @Column(name = "unique_users", nullable = false)
    private long uniqueUsers;

    @Column(name = "rollup_date", nullable = false)
    private LocalDate rollupDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected AnalyticsRollupDaily() {}

    public AnalyticsRollupDaily(String tenantId, String module, String action,
                                long eventCount, long uniqueUsers, LocalDate rollupDate) {
        this.id = UUID.randomUUID().toString();
        this.tenantId = tenantId;
        this.module = module;
        this.action = action;
        this.eventCount = eventCount;
        this.uniqueUsers = uniqueUsers;
        this.rollupDate = rollupDate;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public String getTenantId() { return tenantId; }
    public String getModule() { return module; }
    public String getAction() { return action; }
    public long getEventCount() { return eventCount; }
    public void setEventCount(long eventCount) { this.eventCount = eventCount; }
    public long getUniqueUsers() { return uniqueUsers; }
    public void setUniqueUsers(long uniqueUsers) { this.uniqueUsers = uniqueUsers; }
    public LocalDate getRollupDate() { return rollupDate; }
    public Instant getCreatedAt() { return createdAt; }
}
