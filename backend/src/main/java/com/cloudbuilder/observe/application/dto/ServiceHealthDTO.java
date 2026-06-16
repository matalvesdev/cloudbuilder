package com.cloudbuilder.observe.application.dto;

import com.cloudbuilder.observe.domain.model.ServiceHealth;

import java.time.Instant;

public record ServiceHealthDTO(
        String id,
        String serviceName,
        String environmentId,
        String status,
        double latencyMs,
        double uptimePercent,
        Instant checkedAt
) {
    public static ServiceHealthDTO from(ServiceHealth h) {
        return new ServiceHealthDTO(
                h.getId().toString(), h.getServiceName(), h.getEnvironmentId(),
                h.getStatus(), h.getLatencyMs(), h.getUptimePercent(), h.getCheckedAt());
    }
}
