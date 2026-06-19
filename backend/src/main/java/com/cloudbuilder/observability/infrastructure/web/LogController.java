package com.cloudbuilder.observability.infrastructure.web;

import com.cloudbuilder.observability.application.dto.LogEntryDTO;
import com.cloudbuilder.observability.domain.service.LogService;
import com.cloudbuilder.shared.security.TenantContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/v1/observability/logs")
@PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'VIEWER')")
public class LogController {

    private final LogService logService;

    public LogController(LogService logService) {
        this.logService = logService;
    }

    @GetMapping
    public Page<LogEntryDTO> searchLogs(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) Long startTime,
            @RequestParam(required = false) Long endTime,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        String tenantId = TenantContext.getTenantId();
        Instant start = startTime != null ? Instant.ofEpochMilli(startTime) : Instant.now().minus(Duration.ofHours(1));
        Instant end = endTime != null ? Instant.ofEpochMilli(endTime) : Instant.now();
        return logService.search(tenantId, query, level, start, end, PageRequest.of(page, size));
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamLogs() {
        SseEmitter emitter = new SseEmitter(0L);
        var executor = Executors.newSingleThreadScheduledExecutor();

        executor.scheduleAtFixedRate(() -> {
            try {
                String tenantId = TenantContext.getTenantId();
                if (tenantId == null) return;

                Instant now = Instant.now();
                Page<LogEntryDTO> logs = logService.search(
                    tenantId, null, null, now.minus(Duration.ofMinutes(1)), now,
                    PageRequest.of(0, 50));

                emitter.send(SseEmitter.event()
                    .name("logs")
                    .data(logs.getContent()));
            } catch (IOException e) {
                emitter.completeWithError(e);
                executor.shutdown();
            }
        }, 0, 10, TimeUnit.SECONDS);

        emitter.onCompletion(executor::shutdown);
        emitter.onTimeout(executor::shutdown);

        return emitter;
    }
}
