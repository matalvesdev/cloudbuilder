package com.cloudbuilder.multiregion.application.dto;

public record CreateDisasterRecoveryPlanRequest(
    String tenantId,
    String name,
    String description,
    String primaryRegionId,
    String drRegionId,
    String replicationStrategy,
    int rpoMinutes,
    int rtoMinutes
) {}