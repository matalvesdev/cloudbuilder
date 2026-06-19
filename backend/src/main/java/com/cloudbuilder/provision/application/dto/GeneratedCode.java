package com.cloudbuilder.provision.application.dto;

import java.util.Map;
public record GeneratedCode(
    String canvasId,
    String provider,
    Map<String, String> files,
    int resourceCount,
    long generatedAt
) {}
