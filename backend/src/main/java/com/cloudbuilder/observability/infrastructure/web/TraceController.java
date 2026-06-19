package com.cloudbuilder.observability.infrastructure.web;

import com.cloudbuilder.observability.application.dto.TraceDTO;
import com.cloudbuilder.observability.domain.service.TraceService;
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
@RequestMapping("/api/v1/observability/traces")
@PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'VIEWER')")
public class TraceController {

    private final TraceService traceService;

    public TraceController(TraceService traceService) {
        this.traceService = traceService;
    }

    @GetMapping
    public List<TraceDTO> getTraces(
            @RequestParam(required = false) Long startTime,
            @RequestParam(required = false) Long endTime,
            @RequestParam(defaultValue = "false") boolean onlyErrors) {
        String tenantId = TenantContext.getTenantId();
        Instant start = startTime != null ? Instant.ofEpochMilli(startTime) : Instant.now().minus(Duration.ofHours(1));
        Instant end = endTime != null ? Instant.ofEpochMilli(endTime) : Instant.now();
        return traceService.getTraces(tenantId, start, end, onlyErrors);
    }

    @GetMapping("/{traceId}")
    public TraceDTO getTraceDetail(@PathVariable String traceId) {
        return traceService.getTraceDetail(traceId);
    }

    @GetMapping("/errors")
    public List<TraceDTO> getErrorTraces() {
        String tenantId = TenantContext.getTenantId();
        Instant now = Instant.now();
        return traceService.getTraces(tenantId, now.minus(Duration.ofHours(1)), now, true);
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamTraces() {
        SseEmitter emitter = new SseEmitter(0L);
        var executor = Executors.newSingleThreadScheduledExecutor();

        executor.scheduleAtFixedRate(() -> {
            try {
                String tenantId = TenantContext.getTenantId();
                if (tenantId == null) return;

                Instant now = Instant.now();
                List<TraceDTO> traces = traceService.getTraces(
                    tenantId, now.minus(Duration.ofMinutes(5)), now, false);

                emitter.send(SseEmitter.event()
                    .name("traces")
                    .data(traces));
            } catch (IOException e) {
                emitter.completeWithError(e);
                executor.shutdown();
            }
        }, 0, 30, TimeUnit.SECONDS);

        emitter.onCompletion(executor::shutdown);
        emitter.onTimeout(executor::shutdown);

        return emitter;
    }
}
