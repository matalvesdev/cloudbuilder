package com.cloudbuilder.metrics.domain.service;

import com.cloudbuilder.metrics.application.dto.MetricPointDTO;
import com.cloudbuilder.metrics.application.dto.ResourceMetricsDTO;
import com.cloudbuilder.metrics.application.dto.MetricsSnapshotDTO;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Live metrics service that produces mock metrics snapshots.
 *
 * In production, each cloud provider client (CloudWatch, Azure Monitor, GCP Operations)
 * would implement a ProviderMetricsClient interface and be injected here.
 * For now, generates realistic-looking mock data so the frontend overlay can be built
 * and tested without real cloud credentials.
 *
 * @deprecated Use real metrics persistence via CustomMetrics + MetricsEngine (ADR-008).
 * This mock service will be removed once the native observability subsystem is complete.
 * See ADR-008 Fase 1 — Substituir mock MetricsService por real.
 */
@Deprecated
@Service
public class MetricsService {

    // In-memory cache of last-seen metrics per resource
    private final ConcurrentHashMap<String, ResourceMetricsState> cache = new ConcurrentHashMap<>();
    private long lastTick = 0L;

    /**
     * Returns a full metrics snapshot for all tracked resources.
     *
     * @param resourceMap  nodeId → resource display name
     * @return snapshot with per-resource metrics
     */
    public MetricsSnapshotDTO getSnapshot(Map<String, String> resourceMap) {
        long now = Instant.now().toEpochMilli();
        boolean tick = (now - lastTick) > 30_000; // regenerate every 30s
        if (tick) lastTick = now;

        List<ResourceMetricsDTO> resources = new ArrayList<>();

        for (var entry : resourceMap.entrySet()) {
            String nodeId = entry.getKey();
            String name = entry.getValue();

            ResourceMetricsState state = cache.computeIfAbsent(nodeId, k -> new ResourceMetricsState());

            if (tick) {
                state.cpu = generateMetric("CPU", 5, 60, 95);
                state.memory = generateMetric("Memory", 30, 50, 90);
                state.netIn = generateMetric("NetIn", 100, 500, 2000);
                state.netOut = generateMetric("NetOut", 50, 200, 1000);
                state.diskRead = generateMetric("DiskRead", 10, 100, 500);
                state.diskWrite = generateMetric("DiskWrite", 5, 50, 300);
                state.status = pickStatus();
                state.lastUpdated = now;
            }

            resources.add(new ResourceMetricsDTO(
                nodeId,
                name,
                "resource",
                "aws",
                state.cpu,
                state.memory,
                state.netIn,
                state.netOut,
                state.diskRead,
                state.diskWrite,
                state.status,
                state.lastUpdated
            ));
        }

        return new MetricsSnapshotDTO(now, resources);
    }

    private List<MetricPointDTO> generateMetric(String label, double base, double typical, double max) {
        ThreadLocalRandom rng = ThreadLocalRandom.current();
        long now = Instant.now().toEpochMilli();
        List<MetricPointDTO> points = new ArrayList<>(12);
        // 12 data points over 1 hour (5 min intervals)
        for (int i = 11; i >= 0; i--) {
            long ts = now - (i * 300_000L);
            double val = base + rng.nextDouble(typical - base) + (rng.nextBoolean() ? rng.nextDouble(max - typical) : 0);
            points.add(new MetricPointDTO(ts, Math.round(val * 10.0) / 10.0));
        }
        return points;
    }

    private String pickStatus() {
        double r = ThreadLocalRandom.current().nextDouble();
        if (r < 0.65) return "healthy";
        if (r < 0.85) return "warning";
        if (r < 0.95) return "critical";
        return "unknown";
    }

    static class ResourceMetricsState {
        List<MetricPointDTO> cpu = new ArrayList<>();
        List<MetricPointDTO> memory = new ArrayList<>();
        List<MetricPointDTO> netIn = new ArrayList<>();
        List<MetricPointDTO> netOut = new ArrayList<>();
        List<MetricPointDTO> diskRead = new ArrayList<>();
        List<MetricPointDTO> diskWrite = new ArrayList<>();
        String status = "healthy";
        long lastUpdated = 0L;
    }
}
