package com.cloudbuilder.metrics.infrastructure.web;

import com.cloudbuilder.metrics.application.dto.MetricsSnapshotDTO;
import com.cloudbuilder.metrics.domain.service.MetricsService;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * SSE endpoint for streaming live metrics to the frontend canvas.
 *
 * GET /api/v1/metrics/stream?nodeIds=vpc-1,rds-1,ecs-1
 *  → SSE stream that emits a MetricsSnapshotDTO every 30 seconds
 *
 * POST /api/v1/metrics/snapshot
 *  → Single snapshot (one-shot, no stream)
 */
@RestController
@RequestMapping("/api/v1/metrics")
@PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'VIEWER')")
public class MetricsController {

    private final MetricsService metricsService;

    public MetricsController(MetricsService metricsService) {
        this.metricsService = metricsService;
    }

    /**
     * One-shot metrics snapshot.
     */
    @PostMapping("/snapshot")
    public MetricsSnapshotDTO getSnapshot(@RequestBody Map<String, String> resourceMap) {
        return metricsService.getSnapshot(resourceMap);
    }

    /**
     * SSE streaming endpoint. Emits a new MetricsSnapshotDTO every 30 seconds.
     * Client should reconnect on error (standard SSE behavior).
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamMetrics(@RequestParam Map<String, String> params) {
        // Parse node IDs from query: ?nodeIds=id1,id2,id3&name1=vpc&name2=rds
        String nodeIdsParam = params.getOrDefault("nodeIds", "");
        String[] nodeIds = nodeIdsParam.isEmpty() ? new String[0] : nodeIdsParam.split(",");

        // Build resource map from sequential name params: name0, name1, ...
        Map<String, String> resourceMap = new ConcurrentHashMap<>();
        for (int i = 0; i < nodeIds.length; i++) {
            String name = params.getOrDefault("name" + i, "Resource " + (i + 1));
            resourceMap.put(nodeIds[i], name);
        }

        // Fallback: if no nodeIds provided, use dummy data
        if (resourceMap.isEmpty()) {
            resourceMap.put("node-1", "VPC Principal");
            resourceMap.put("node-2", "RDS PostgreSQL");
            resourceMap.put("node-3", "ECS Fargate");
            resourceMap.put("node-4", "ElastiCache Redis");
            resourceMap.put("node-5", "ALB");
        }

        SseEmitter emitter = new SseEmitter(0L); // no timeout
        ScheduledExecutorService executor = Executors.newSingleThreadScheduledExecutor();

        executor.scheduleAtFixedRate(() -> {
            try {
                MetricsSnapshotDTO snapshot = metricsService.getSnapshot(resourceMap);
                emitter.send(SseEmitter.event()
                    .name("metrics")
                    .data(snapshot));
            } catch (IOException e) {
                emitter.completeWithError(e);
                executor.shutdown();
            }
        }, 0, 30, TimeUnit.SECONDS);

        emitter.onCompletion(executor::shutdown);
        emitter.onTimeout(executor::shutdown);
        emitter.onError(e -> executor.shutdown());

        return emitter;
    }
}
