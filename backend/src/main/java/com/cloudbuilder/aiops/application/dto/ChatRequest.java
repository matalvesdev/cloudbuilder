package com.cloudbuilder.aiops.application.dto;

public record ChatRequest(
    String question,
    String context
) {}
