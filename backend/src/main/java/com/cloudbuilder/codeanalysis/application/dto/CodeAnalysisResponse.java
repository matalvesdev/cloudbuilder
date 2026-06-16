package com.cloudbuilder.codeanalysis.application.dto;

import java.util.List;
import java.util.Map;

public record CodeAnalysisResponse(
    String repoUrl,
    String detectedStack,
    String stackDescription,
    List<String> detectedFrameworks,
    List<InferredResource> inferredResources,
    List<String> warnings
) {
    public record InferredResource(
        String resourceType,
        String provider,
        String displayName,
        String description,
        double confidence,
        List<String> evidence,
        Map<String, Object> suggestedProperties
    ) {}
}
