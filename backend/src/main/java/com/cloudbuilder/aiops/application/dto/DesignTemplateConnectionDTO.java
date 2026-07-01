package com.cloudbuilder.aiops.application.dto;

public record DesignTemplateConnectionDTO(
    String source,
    String target,
    String edgeType
) {}
