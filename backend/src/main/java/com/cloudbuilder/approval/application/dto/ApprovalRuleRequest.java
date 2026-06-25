package com.cloudbuilder.approval.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record ApprovalRuleRequest(
    @NotBlank String tenantId,
    @NotBlank String environmentId,
    boolean requiresApproval,
    String approversJson,
    @Positive int minApprovals
) {}
