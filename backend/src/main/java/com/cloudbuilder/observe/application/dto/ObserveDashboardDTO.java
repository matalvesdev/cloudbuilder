package com.cloudbuilder.observe.application.dto;

import java.util.List;

public record ObserveDashboardDTO(
        int totalServices,
        int degradedServices,
        int downServices,
        double averageLatencyMs,
        double averageUptime,
        List<ServiceHealthDTO> services,
        List<AlertDTO> recentAlerts
) {}
