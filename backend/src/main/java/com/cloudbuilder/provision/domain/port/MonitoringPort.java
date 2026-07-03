package com.cloudbuilder.provision.domain.port;

import java.util.Map;

/**
 * Port for monitoring operations.
 * Implemented by monitoring adapter in infrastructure layer.
 */
public interface MonitoringPort {
    /** Get health status of all services. */
    Map<String, Object> getHealthStatus(String environmentId);

    /** Get active alerts. */
    java.util.List<Map<String, Object>> getAlerts(String environmentId);

    /** Get metrics for a specific resource. */
    Map<String, Object> getMetrics(String resourceId, String metricName, int hours);

    /** Get service topology. */
    Map<String, Object> getTopology(String environmentId);
}
