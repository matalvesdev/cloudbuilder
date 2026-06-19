package com.cloudbuilder.observability.infrastructure.web;

import com.cloudbuilder.observability.application.dto.IncidentDTO;
import com.cloudbuilder.observability.domain.service.IncidentService;
import com.cloudbuilder.shared.security.TenantContext;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/v1/observability/incidents")
@PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'VIEWER')")
public class IncidentController {

    private final IncidentService incidentService;

    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    @GetMapping
    public List<IncidentDTO> getIncidents(
            @RequestParam(defaultValue = "OPEN") String status) {
        String tenantId = TenantContext.getTenantId();
        return incidentService.getIncidentsByStatus(tenantId, status);
    }

    @PostMapping("/{id}/acknowledge")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
    public IncidentDTO acknowledgeIncident(@PathVariable String id) {
        return incidentService.acknowledge(id);
    }

    @PostMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
    public IncidentDTO resolveIncident(@PathVariable String id) {
        return incidentService.resolve(id);
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamIncidents() {
        SseEmitter emitter = new SseEmitter(0L);
        var executor = Executors.newSingleThreadScheduledExecutor();

        executor.scheduleAtFixedRate(() -> {
            try {
                String tenantId = TenantContext.getTenantId();
                if (tenantId == null) return;

                List<IncidentDTO> active = incidentService.getIncidentsByStatus(tenantId, "OPEN");
                emitter.send(SseEmitter.event()
                    .name("incidents")
                    .data(active));
            } catch (IOException e) {
                emitter.completeWithError(e);
                executor.shutdown();
            }
        }, 0, 15, TimeUnit.SECONDS);

        emitter.onCompletion(executor::shutdown);
        emitter.onTimeout(executor::shutdown);

        return emitter;
    }
}
