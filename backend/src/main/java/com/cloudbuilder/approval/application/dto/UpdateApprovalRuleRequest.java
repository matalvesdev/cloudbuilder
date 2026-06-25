package com.cloudbuilder.approval.application.dto;

import jakarta.validation.constraints.Positive;

public record UpdateApprovalRuleRequest(
    boolean requiresApproval,
    String approversJson,
    @Positive int minApprovals
) {}
