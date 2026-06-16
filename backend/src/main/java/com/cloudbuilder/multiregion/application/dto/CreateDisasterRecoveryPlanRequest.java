package com.cloudbuilder.multiregion.application.dto;

import java.util.UUID;

public record CreateDisasterRecoveryPlanRequest(
    String tenantId,
    String name,
    String description,
    UUID primaryRegionId,
    UUID drRegionId,
    String replicationStrategy,
    int rpoMinutes,
    int rtoMinutes
) {}