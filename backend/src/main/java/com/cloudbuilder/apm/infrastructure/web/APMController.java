package com.cloudbuilder.apm.infrastructure.web;

import com.cloudbuilder.apm.application.dto.APMSnapshotDTO;
import com.cloudbuilder.apm.application.dto.AlertDTO;
import com.cloudbuilder.apm.application.dto.TraceDTO;
import com.cloudbuilder.apm.application.dto.SpanDTO;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;

/**
 * APM (Application Performance Monitoring) controller.
 *
 * Returns mock traces and alerts for the frontend observability dashboard.
 * In production, this would query OpenTelemetry collector, Jaeger, or Datadog API.
 */
@RestController
@RequestMapping("/api/v1/apm")
@PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'VIEWER')")
public class APMController {

    private static final List<String> SERVICES = List.of("api-gateway", "user-service", "payment-service", "inventory-service", "notification-service");
    private static final List<String> OPERATIONS = List.of("GET /users", "POST /orders", "GET /products", "PUT /inventory", "DELETE /cache", "GET /health");
    private static final List<String> RESOURCES = List.of("ECS Fargate", "RDS PostgreSQL", "ElastiCache Redis", "ALB", "VPC Principal");

    private final ThreadLocalRandom rng = ThreadLocalRandom.current();

    @GetMapping("/snapshot")
    public APMSnapshotDTO getSnapshot() {
        return generateSnapshot();
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamAPM() {
        SseEmitter emitter = new SseEmitter(0L);
        ScheduledExecutorService executor = Executors.newSingleThreadScheduledExecutor();

        executor.scheduleAtFixedRate(() -> {
            try {
                APMSnapshotDTO snapshot = generateSnapshot();
                emitter.send(SseEmitter.event()
                    .name("apm")
                    .data(snapshot));
            } catch (IOException e) {
                emitter.completeWithError(e);
                executor.shutdown();
            }
        }, 0, 15, TimeUnit.SECONDS);

        emitter.onCompletion(executor::shutdown);
        emitter.onTimeout(executor::shutdown);

        return emitter;
    }

    private APMSnapshotDTO generateSnapshot() {
        long now = Instant.now().toEpochMilli();

        // Generate 10 traces
        List<TraceDTO> traces = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            String service = pick(SERVICES);
            String operation = pick(OPERATIONS);
            long startTime = now - rng.nextLong(300_000);
            long duration = rng.nextLong(50, 2000);
            boolean error = rng.nextDouble() < 0.1;

            List<SpanDTO> spans = new ArrayList<>();
            int spanCount = rng.nextInt(1, 4);
            for (int j = 0; j < spanCount; j++) {
                spans.add(new SpanDTO(
                    UUID.randomUUID().toString().toString().substring(0, 8),
                    j == 0 ? operation : "internal." + operation,
                    j == 0 ? service : pick(SERVICES),
                    startTime + (j * duration / spanCount),
                    duration / spanCount,
                    j == 0 && error ? 500 : 200,
                    error && j == 0 ? "ERROR" : "OK"
                ));
            }

            traces.add(new TraceDTO(
                UUID.randomUUID().toString().toString().substring(0, 12),
                service,
                operation,
                startTime,
                duration,
                error ? 500 : 200,
                error,
                spans
            ));
        }

        // Generate 3-5 alerts
        int alertCount = rng.nextInt(3, 6);
        List<AlertDTO> alerts = new ArrayList<>();
        String[] severities = {"critical", "warning", "info"};
        String[] titles = {
            "CPU acima de 90%", "Latência elevada", "Erro 5xx detectado",
            "Conexões esgotadas", "Memória acima de 85%", "Timeouts de banco",
            "Certificado próximo do vencimento", "Disco quase cheio"
        };
        String[] messages = {
            "CPU utilization above 90% threshold for 5 minutes",
            "P99 latency exceeded 2s threshold",
            "5xx error rate above 5% in last minute",
            "Database connection pool exhausted",
            "Memory usage above 85% threshold",
            "Query timeouts detected on primary instance",
            "SSL certificate expires in 7 days",
            "Disk usage above 90% capacity"
        };

        for (int i = 0; i < alertCount; i++) {
            int idx = rng.nextInt(titles.length);
            alerts.add(new AlertDTO(
                UUID.randomUUID().toString().toString().substring(0, 8),
                severities[rng.nextInt(severities.length)],
                titles[idx],
                messages[idx],
                pick(RESOURCES),
                "aws_ecs_service",
                now - rng.nextLong(3600_000),
                rng.nextBoolean()
            ));
        }

        // Sort alerts by severity
        alerts.sort((a, b) -> {
            int cmp = severityOrder(a.severity()) - severityOrder(b.severity());
            if (cmp == 0) return Long.compare(b.timestamp(), a.timestamp());
            return cmp;
        });

        return new APMSnapshotDTO(traces, alerts, now);
    }

    private int severityOrder(String s) {
        return switch (s) {
            case "critical" -> 0;
            case "warning" -> 1;
            default -> 2;
        };
    }

    private <T> T pick(List<T> list) {
        return list.get(rng.nextInt(list.size()));
    }
}
