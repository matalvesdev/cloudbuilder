package com.cloudbuilder.billing.application.dto;

import com.cloudbuilder.billing.domain.model.BillingPlan;
import java.math.BigDecimal;

public record BillingPlanDTO(
    String id,
    String code,
    String name,
    String description,
    BigDecimal monthlyPrice,
    BigDecimal annualPrice,
    int maxUsers,
    int maxProjects,
    int maxDeploymentsPerMonth,
    long maxResources
) {
    public static BillingPlanDTO from(BillingPlan plan) {
        return new BillingPlanDTO(
            plan.getId(), plan.getCode(), plan.getName(), plan.getDescription(),
            plan.getMonthlyPrice(), plan.getAnnualPrice(),
            plan.getMaxUsers(), plan.getMaxProjects(),
            plan.getMaxDeploymentsPerMonth(), plan.getMaxResources()
        );
    }
}
