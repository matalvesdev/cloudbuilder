package com.cloudbuilder.approval.application.dto;

import com.cloudbuilder.approval.domain.model.ApprovalRequest.RequestType;
import jakarta.validation.constraints.NotBlank;

public record SubmitApprovalRequest(
    @NotBlank String tenantId,
    @NotBlank String environmentId,
    @NotBlank RequestType requestType,
    @NotBlank String requestedBy
) {}
