package com.cloudbuilder.analytics.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Pre-aggregated daily user activity rollup.
 * Populated nightly by AggregationService.aggregateDaily().
 */
@Entity
@Table(name = "analytics_user_rollup_daily", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"tenant_id", "user_id", "module", "rollup_date"})
})
public class AnalyticsUserRollupDaily {

    @Id
    private String id;

    @Column(name = "tenant_id", nullable = false, length = 64)
    private String tenantId;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Column(nullable = false, length = 50)
    private String module;

    @Column(name = "event_count", nullable = false)
    private long eventCount;

    @Column(name = "rollup_date", nullable = false)
    private LocalDate rollupDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected AnalyticsUserRollupDaily() {}

    public AnalyticsUserRollupDaily(String tenantId, String userId, String module,
                                    long eventCount, LocalDate rollupDate) {
        this.id = UUID.randomUUID().toString();
        this.tenantId = tenantId;
        this.userId = userId;
        this.module = module;
        this.eventCount = eventCount;
        this.rollupDate = rollupDate;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public String getTenantId() { return tenantId; }
    public String getUserId() { return userId; }
    public String getModule() { return module; }
    public long getEventCount() { return eventCount; }
    public void setEventCount(long eventCount) { this.eventCount = eventCount; }
    public LocalDate getRollupDate() { return rollupDate; }
    public Instant getCreatedAt() { return createdAt; }
}
