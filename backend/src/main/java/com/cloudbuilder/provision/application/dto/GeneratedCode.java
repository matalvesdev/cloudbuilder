package com.cloudbuilder.provision.application.dto;

import java.util.Map;
import java.util.UUID;

public record GeneratedCode(
    UUID canvasId,
    String provider,
    Map<String, String> files,
    int resourceCount,
    long generatedAt
) {}
