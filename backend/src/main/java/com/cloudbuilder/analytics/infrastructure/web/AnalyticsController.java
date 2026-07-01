package com.cloudbuilder.analytics.infrastructure.web;

import com.cloudbuilder.analytics.domain.model.AnalyticsEvent;
import com.cloudbuilder.analytics.domain.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/analytics")
@PreAuthorize("hasRole('ADMIN')")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @PostMapping("/events")
    public ResponseEntity<AnalyticsEvent> trackEvent(@RequestBody AnalyticsEvent event) {
        return ResponseEntity.ok(analyticsService.trackEvent(event));
    }

    @GetMapping("/events/{tenantId}")
    public ResponseEntity<List<AnalyticsEvent>> getEvents(@PathVariable String tenantId) {
        return ResponseEntity.ok(analyticsService.getEventsByTenant(tenantId));
    }

    @GetMapping("/events/{tenantId}/module/{module}")
    public ResponseEntity<List<AnalyticsEvent>> getEventsByModule(
            @PathVariable String tenantId, @PathVariable String module) {
        return ResponseEntity.ok(analyticsService.getEventsByTenantAndModule(tenantId, module));
    }

    @GetMapping("/usage/{tenantId}")
    public ResponseEntity<Map<String, Long>> getModuleUsage(
            @PathVariable String tenantId,
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(analyticsService.getModuleUsage(tenantId, days));
    }

    @GetMapping("/activity/{tenantId}")
    public ResponseEntity<Map<String, Long>> getUserActivity(
            @PathVariable String tenantId,
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(analyticsService.getUserActivity(tenantId, days));
    }
}
