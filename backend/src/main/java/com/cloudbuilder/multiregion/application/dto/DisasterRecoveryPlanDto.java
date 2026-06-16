package com.cloudbuilder.multiregion.application.dto;

import com.cloudbuilder.multiregion.domain.model.DisasterRecoveryPlan;
import com.cloudbuilder.multiregion.domain.model.Region;
import java.time.Instant;
import java.util.UUID;

public record DisasterRecoveryPlanDto(
    UUID id,
    String tenantId,
    String name,
    String description,
    RegionDto primaryRegion,
    RegionDto drRegion,
    String replicationStrategy,
    int rpoMinutes,
    int rtoMinutes,
    String status,
    String failoverProcedure,
    String fallbackProcedure,
    Instant createdAt,
    Instant updatedAt,
    Instant lastTestedAt,
    Instant lastFailoverAt
) {
    public static DisasterRecoveryPlanDto from(DisasterRecoveryPlan plan) {
        return new DisasterRecoveryPlanDto(
            plan.getId(),
            plan.getTenantId(),
            plan.getName(),
            plan.getDescription(),
            RegionDto.from(plan.getPrimaryRegion()),
            RegionDto.from(plan.getDrRegion()),
            plan.getReplicationStrategy(),
            plan.getRpoMinutes(),
            plan.getRtoMinutes(),
            plan.getStatus(),
            plan.getFailoverProcedure(),
            plan.getFallbackProcedure(),
            plan.getCreatedAt(),
            plan.getUpdatedAt(),
            plan.getLastTestedAt(),
            plan.getLastFailoverAt()
        );
    }
}