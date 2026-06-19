package com.cloudbuilder.multiregion.application.dto;

import com.cloudbuilder.multiregion.domain.model.Region;
import java.time.Instant;
public record RegionDto(
    String id,
    String code,
    String name,
    String provider,
    String country,
    boolean isPrimary,
    boolean isActive,
    String metadata,
    Instant createdAt,
    Instant updatedAt
) {
    public static RegionDto from(Region region) {
        return new RegionDto(
            region.getId(),
            region.getCode(),
            region.getName(),
            region.getProvider(),
            region.getCountry(),
            region.isPrimary(),
            region.isActive(),
            region.getMetadata(),
            region.getCreatedAt(),
            region.getUpdatedAt()
        );
    }
}