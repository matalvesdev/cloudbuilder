package com.cloudbuilder.shared.event.listener;

import com.cloudbuilder.audit.domain.service.AuditService;
import com.cloudbuilder.observability.domain.service.MetricsService;
import com.cloudbuilder.shared.event.domain.IncidentEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Listens to incident lifecycle events and reacts across modules.
 * - Records incidents in Audit module
 * - Records metrics for operational dashboards
 *
 * <p>Spring @EventListener fallback — active only when Kafka is DISABLED.
 * When Kafka is enabled, IncidentEventListenerKafka handles consumption.
 */
@Component
@ConditionalOnProperty(name = "cloudbuilder.kafka.enabled", havingValue = "false", matchIfMissing = true)
public class IncidentEventListener {

    private static final Logger log = LoggerFactory.getLogger(IncidentEventListener.class);

    private final AuditService auditService;
    private final MetricsService metricsService;

    public IncidentEventListener(AuditService auditService,
                                 MetricsService metricsService) {
        this.auditService = auditService;
        this.metricsService = metricsService;
    }

    @EventListener
    public void onIncidentCreated(IncidentEvent event) {
        if (!"created".equalsIgnoreCase(event.status())) return;
        log.warn("Incident created: [{}] {} - {}",
            event.severity(), event.title(), event.incidentId());
        // Cross-module reaction: record audit event
        auditService.recordEvent(
            event.tenantId(),
            "system",
            "incident.created",
            "incident",
            event.incidentId(),
            "Severity: " + event.severity() + ", Source: " + event.source() + ", Title: " + event.title(),
            null
        );
    }

    @EventListener
    public void onIncidentResolved(IncidentEvent event) {
        if (!"resolved".equalsIgnoreCase(event.status())) return;
        log.info("Incident resolved: {} ({})", event.title(), event.incidentId());
        // Cross-module reaction: record incident resolution metric
        metricsService.record(
            "incident.resolution",
            1.0,
            event.tenantId(),
            Map.of(
                "incidentId", event.incidentId(),
                "severity", event.severity(),
                "source", event.source()
            )
        );
    }
}
