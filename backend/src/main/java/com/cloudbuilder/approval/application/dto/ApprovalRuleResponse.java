package com.cloudbuilder.approval.application.dto;

import com.cloudbuilder.approval.domain.model.ApprovalRule;
import java.time.Instant;

public record ApprovalRuleResponse(
    String id,
    String tenantId,
    String environmentId,
    boolean requiresApproval,
    String approversJson,
    int minApprovals,
    Instant createdAt,
    Instant updatedAt
) {
    public static ApprovalRuleResponse from(ApprovalRule rule) {
        return new ApprovalRuleResponse(
            rule.getId(), rule.getTenantId(), rule.getEnvironmentId(),
            rule.isRequiresApproval(), rule.getApproversJson(),
            rule.getMinApprovals(), rule.getCreatedAt(), rule.getUpdatedAt());
    }
}
