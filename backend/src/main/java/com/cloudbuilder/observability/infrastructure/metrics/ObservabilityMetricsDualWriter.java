package com.cloudbuilder.observability.infrastructure.metrics;

import com.cloudbuilder.observability.domain.service.MetricsService;
import com.cloudbuilder.shared.monitoring.MetricsDualWriter;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Bridges domain metrics from CustomMetrics into the observability module's
 * PostgreSQL-backed MetricsService for persistent time-series storage.
 * <p>
 * Registered as a {@link MetricsDualWriter} so that {@code CustomMetrics}
 * can call back without creating a direct Modulith dependency from
 * the shared module to the observability module.
 */
@Component
public class ObservabilityMetricsDualWriter implements MetricsDualWriter {

    private final MetricsService metricsService;

    public ObservabilityMetricsDualWriter(@Qualifier("observabilityMetricsService") MetricsService metricsService) {
        this.metricsService = metricsService;
    }

    @Override
    public void recordMetric(String name, double value, String tenantId, Map<String, String> tags) {
        if (tenantId == null || tenantId.isBlank()) {
            // If no tenant context is available, skip dual-write
            return;
        }
        metricsService.record(name, value, tenantId, tags);
    }
}
