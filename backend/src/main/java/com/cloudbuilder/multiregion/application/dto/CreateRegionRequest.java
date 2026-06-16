package com.cloudbuilder.multiregion.application.dto;

public record CreateRegionRequest(
    String code,
    String name,
    String provider,
    String country,
    boolean isPrimary
) {}