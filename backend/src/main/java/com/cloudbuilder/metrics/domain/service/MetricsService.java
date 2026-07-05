package com.cloudbuilder.metrics.domain.service;

import com.cloudbuilder.metrics.application.dto.MetricPointDTO;
import com.cloudbuilder.metrics.application.dto.ResourceMetricsDTO;
import com.cloudbuilder.metrics.application.dto.MetricsSnapshotDTO;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

/**
 * Metrics service that returns empty snapshots.
 *
 * In production, each cloud provider client (CloudWatch, Azure Monitor, GCP Operations)
 * would implement a ProviderMetricsClient interface and be injected here.
 * Without configured providers, returns empty snapshots.
 */
@Service
public class MetricsService {

    /**
     * Returns a metrics snapshot for tracked resources.
     * Without real provider integrations configured, returns empty metrics.
     *
     * @param resourceMap  nodeId → resource display name
     * @return snapshot with empty per-resource metrics
     */
    public MetricsSnapshotDTO getSnapshot(Map<String, String> resourceMap) {
        long now = Instant.now().toEpochMilli();
        List<ResourceMetricsDTO> resources = new ArrayList<>();

        for (var entry : resourceMap.entrySet()) {
            String nodeId = entry.getKey();
            String name = entry.getValue();

            resources.add(new ResourceMetricsDTO(
                nodeId,
                name,
                "resource",
                "unknown",
                Collections.emptyList(),
                Collections.emptyList(),
                Collections.emptyList(),
                Collections.emptyList(),
                Collections.emptyList(),
                Collections.emptyList(),
                "unknown",
                now
            ));
        }

        return new MetricsSnapshotDTO(now, resources);
    }
}
