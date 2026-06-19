package com.cloudbuilder.observability.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
@Entity
@Table(name = "sli_snapshots")
public class SloSnapshotEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "slo_id", nullable = false)
    private String sloId;

    @Column(name = "tenant_id", nullable = false, length = 64)
    private String tenantId;

    @Column(name = "window_start", nullable = false)
    private Instant windowStart;

    @Column(name = "window_end", nullable = false)
    private Instant windowEnd;

    @Column(name = "good_count", nullable = false)
    private long goodCount;

    @Column(name = "total_count", nullable = false)
    private long totalCount;

    @Column(name = "sli_pct", nullable = false)
    private double sliPct;

    @Column(name = "error_budget_pct")
    private Double errorBudgetPct;

    @Column(name = "computed_at", nullable = false)
    private Instant computedAt;

    public SloSnapshotEntity() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSloId() { return sloId; }
    public void setSloId(String sloId) { this.sloId = sloId; }
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    public Instant getWindowStart() { return windowStart; }
    public void setWindowStart(Instant windowStart) { this.windowStart = windowStart; }
    public Instant getWindowEnd() { return windowEnd; }
    public void setWindowEnd(Instant windowEnd) { this.windowEnd = windowEnd; }
    public long getGoodCount() { return goodCount; }
    public void setGoodCount(long goodCount) { this.goodCount = goodCount; }
    public long getTotalCount() { return totalCount; }
    public void setTotalCount(long totalCount) { this.totalCount = totalCount; }
    public double getSliPct() { return sliPct; }
    public void setSliPct(double sliPct) { this.sliPct = sliPct; }
    public Double getErrorBudgetPct() { return errorBudgetPct; }
    public void setErrorBudgetPct(Double errorBudgetPct) { this.errorBudgetPct = errorBudgetPct; }
    public Instant getComputedAt() { return computedAt; }
    public void setComputedAt(Instant computedAt) { this.computedAt = computedAt; }
}
