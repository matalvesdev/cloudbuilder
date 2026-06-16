package com.cloudbuilder.aiops.application.dto;

public record AnalysisResult(
    String classification,
    String suggestedRca,
    String severity
) {}
