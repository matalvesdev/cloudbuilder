package com.cloudbuilder.multiregion.application.dto;

public record UpdateDisasterRecoveryPlanRequest(
    String name,
    String description,
    String replicationStrategy,
    Integer rpoMinutes,
    Integer rtoMinutes,
    String failoverProcedure,
    String fallbackProcedure
) {}