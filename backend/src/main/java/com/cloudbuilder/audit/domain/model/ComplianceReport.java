package com.cloudbuilder.audit.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "compliance_reports")
public class ComplianceReport {

    @Id
    private String id;

    @Column(nullable = false)
    private String tenantId;

    @Column(nullable = false)
    private String environmentId;

    @Column(nullable = false)
    private String reportType;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private int totalRules;

    @Column(nullable = false)
    private int passedRules;

    @Column(nullable = false)
    private int failedRules;

    @Column(nullable = false)
    private int warningRules;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected ComplianceReport() {}

    public ComplianceReport(String tenantId, String environmentId, String reportType,
                            int totalRules, int passedRules, int failedRules, int warningRules) {
        this.id = UUID.randomUUID().toString();
        this.tenantId = tenantId;
        this.environmentId = environmentId;
        this.reportType = reportType;
        this.status = "IN_PROGRESS";
        this.totalRules = totalRules;
        this.passedRules = passedRules;
        this.failedRules = failedRules;
        this.warningRules = warningRules;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public String getTenantId() { return tenantId; }
    public String getEnvironmentId() { return environmentId; }
    public String getReportType() { return reportType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getTotalRules() { return totalRules; }
    public int getPassedRules() { return passedRules; }
    public void setPassedRules(int passedRules) { this.passedRules = passedRules; }
    public int getFailedRules() { return failedRules; }
    public void setFailedRules(int failedRules) { this.failedRules = failedRules; }
    public int getWarningRules() { return warningRules; }
    public void setWarningRules(int warningRules) { this.warningRules = warningRules; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
