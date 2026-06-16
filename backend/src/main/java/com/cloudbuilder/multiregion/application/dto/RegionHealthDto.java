package com.cloudbuilder.multiregion.application.dto;

import com.cloudbuilder.multiregion.domain.model.RegionHealth;
import java.time.Instant;
import java.util.UUID;

public record RegionHealthDto(
    UUID id,
    String regionCode,
    String status,
    double latencyMs,
    double availabilityPercent,
    String details,
    Instant checkedAt
) {
    public static RegionHealthDto from(RegionHealth health) {
        return new RegionHealthDto(
            health.getId(),
            health.getRegionCode(),
            health.getStatus(),
            health.getLatencyMs(),
            health.getAvailabilityPercent(),
            health.getDetails(),
            health.getCheckedAt()
        );
    }
}