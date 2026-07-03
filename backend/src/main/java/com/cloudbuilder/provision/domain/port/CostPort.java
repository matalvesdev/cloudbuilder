package com.cloudbuilder.provision.domain.port;

import java.util.Map;

/**
 * Port for cost analysis operations.
 * Implemented by cost adapter in infrastructure layer.
 */
public interface CostPort {
    /** Get current cost for an environment. */
    Map<String, Object> getCurrentCost(String environmentId);

    /** Get cost forecast. */
    Map<String, Object> getForecast(String environmentId, int days);

    /** Get cost breakdown by resource. */
    java.util.List<Map<String, Object>> getBreakdown(String environmentId);

    /** Get optimization suggestions. */
    java.util.List<Map<String, String>> getSuggestions(String environmentId);
}
