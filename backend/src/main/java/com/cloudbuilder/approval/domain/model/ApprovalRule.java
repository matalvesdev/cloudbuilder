package com.cloudbuilder.approval.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "approval_rules")
public class ApprovalRule {

    @Id
    private String id;

    @Column(nullable = false)
    private String tenantId;

    @Column(nullable = false)
    private String environmentId;

    @Column(nullable = false)
    private boolean requiresApproval;

    @Column(columnDefinition = "TEXT")
    private String approversJson;

    private int minApprovals;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected ApprovalRule() {}

    public ApprovalRule(String tenantId, String environmentId, boolean requiresApproval,
                        String approversJson, int minApprovals) {
        this.id = UUID.randomUUID().toString();
        this.tenantId = tenantId;
        this.environmentId = environmentId;
        this.requiresApproval = requiresApproval;
        this.approversJson = approversJson;
        this.minApprovals = minApprovals;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public String getTenantId() { return tenantId; }
    public String getEnvironmentId() { return environmentId; }
    public boolean isRequiresApproval() { return requiresApproval; }
    public String getApproversJson() { return approversJson; }
    public int getMinApprovals() { return minApprovals; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void setRequiresApproval(boolean requiresApproval) { this.requiresApproval = requiresApproval; }
    public void setApproversJson(String approversJson) { this.approversJson = approversJson; }
    public void setMinApprovals(int minApprovals) { this.minApprovals = minApprovals; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
