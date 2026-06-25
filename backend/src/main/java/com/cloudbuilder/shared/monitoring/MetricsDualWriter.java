package com.cloudbuilder.shared.monitoring;

import java.util.Map;

/**
 * Functional interface for dual-writing metrics to persistent storage
 * (e.g., PostgreSQL via the observability MetricsService).
 * <p>
 * CustomMetrics uses this to optionally write domain metrics to the
 * observability module's time-series store without creating a direct
 * Modulith dependency from shared -> observability.
 * <p>
 * The observability module provides a @Component implementation that
 * delegates to MetricsService.record().
 */
@FunctionalInterface
public interface MetricsDualWriter {

    /**
     * Record a metric value with associated tags.
     *
     * @param name     the metric name (e.g., "cloudbuilder.canvas.created")
     * @param value    the metric value (typically 1.0 for counters)
     * @param tenantId the tenant context
     * @param tags     additional dimensions (can be empty)
     */
    void recordMetric(String name, double value, String tenantId, Map<String, String> tags);
}
