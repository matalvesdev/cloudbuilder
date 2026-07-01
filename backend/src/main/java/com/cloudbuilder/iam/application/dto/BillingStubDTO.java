package com.cloudbuilder.iam.application.dto;

import com.cloudbuilder.iam.domain.model.BillingPlan;
import com.cloudbuilder.iam.domain.model.BillingStub;
import java.time.LocalDateTime;

public record BillingStubDTO(
    String id,
    String organizationId,
    BillingPlan plan,
    boolean active,
    String stripeCustomerId,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static BillingStubDTO fromEntity(BillingStub stub) {
        return new BillingStubDTO(
            stub.getId(),
            stub.getOrganizationId(),
            stub.getPlan(),
            stub.isActive(),
            stub.getStripeCustomerId(),
            stub.getCreatedAt(),
            stub.getUpdatedAt()
        );
    }

    public record UpdateBillingPlanRequest(BillingPlan plan) {}
}
