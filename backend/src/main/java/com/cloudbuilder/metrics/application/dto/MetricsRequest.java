package com.cloudbuilder.metrics.application.dto;

import java.util.Map;

public record MetricsRequest(
    String provider,       // "aws" | "azure" | "gcp"
    Map<String, String> credentials,
    Map<String, String> resourceMap  // nodeId → resourceId/ARN
) {}
