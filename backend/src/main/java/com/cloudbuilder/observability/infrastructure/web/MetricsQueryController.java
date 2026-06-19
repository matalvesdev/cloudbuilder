package com.cloudbuilder.observability.infrastructure.web;

import com.cloudbuilder.observability.application.dto.MetricQueryRequest;
import com.cloudbuilder.observability.application.dto.MetricQueryResult;
import com.cloudbuilder.observability.domain.service.MetricsService;
import com.cloudbuilder.shared.security.TenantContext;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/v1/observability/metrics")
@PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'VIEWER')")
public class MetricsQueryController {

    private final MetricsService metricsService;

    public MetricsQueryController(MetricsService metricsService) {
        this.metricsService = metricsService;
    }

    @GetMapping("/query")
    public List<MetricQueryResult> queryMetrics(
            @RequestParam String metricName,
            @RequestParam(required = false) Long startTime,
            @RequestParam(required = false) Long endTime,
            @RequestParam(defaultValue = "AVG") String aggregation) {

        String tenantId = TenantContext.getTenantId();
        Instant start = startTime != null ? Instant.ofEpochMilli(startTime) : Instant.now().minus(Duration.ofHours(1));
        Instant end = endTime != null ? Instant.ofEpochMilli(endTime) : Instant.now();

        return metricsService.query(new MetricQueryRequest(
            metricName, tenantId, start, end, aggregation, List.of()));
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamMetrics() {
        SseEmitter emitter = new SseEmitter(0L);
        var executor = Executors.newSingleThreadScheduledExecutor();

        executor.scheduleAtFixedRate(() -> {
            try {
                String tenantId = TenantContext.getTenantId();
                if (tenantId == null) return;

                Instant now = Instant.now();
                List<MetricQueryResult> metrics = metricsService.query(
                    new MetricQueryRequest(null, tenantId,
                        now.minus(Duration.ofMinutes(5)), now, "AVG", List.of()));

                emitter.send(SseEmitter.event()
                    .name("metrics")
                    .data(metrics));
            } catch (IOException e) {
                emitter.completeWithError(e);
                executor.shutdown();
            }
        }, 0, 30, TimeUnit.SECONDS);

        emitter.onCompletion(executor::shutdown);
        emitter.onTimeout(executor::shutdown);

        return emitter;
    }

    @PostMapping("/record")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
    public void recordMetric(@RequestBody RecordMetricRequest request) {
        String tenantId = TenantContext.getTenantId();
        metricsService.record(request.metricName(), request.value(), tenantId);
    }

    private record RecordMetricRequest(String metricName, double value) {}
}
