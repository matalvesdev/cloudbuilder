package com.cloudbuilder.shared.event.listener;

import com.cloudbuilder.aiops.domain.service.IncidentService;
import com.cloudbuilder.observe.domain.service.HealthCheckService;
import com.cloudbuilder.shared.event.domain.DeploymentEvent;
import com.cloudbuilder.shared.event.domain.HealthStateEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Listens to deployment lifecycle events and reacts across modules.
 * - Updates service health on deploy complete/failure (via HealthCheckService)
 * - Creates alerts on deploy failure (via HealthCheckService)
 * - Creates incidents on health state degradation (via AIOps IncidentService)
 *
 * <p>Spring @EventListener fallback — active only when Kafka is DISABLED.
 * When Kafka is enabled, DeploymentEventListenerKafka handles consumption.
 */
@Component
@ConditionalOnProperty(name = "cloudbuilder.kafka.enabled", havingValue = "false", matchIfMissing = true)
public class DeploymentEventListener {

    private static final Logger log = LoggerFactory.getLogger(DeploymentEventListener.class);

    private final HealthCheckService healthCheckService;
    private final IncidentService incidentService;

    public DeploymentEventListener(HealthCheckService healthCheckService,
                                   IncidentService incidentService) {
        this.healthCheckService = healthCheckService;
        this.incidentService = incidentService;
    }

    @EventListener
    public void onDeploymentStarted(DeploymentEvent event) {
        if (!"started".equalsIgnoreCase(event.status())) return;
        log.info("Deployment started: {} in environment {}", event.deploymentId(), event.environmentId());
    }

    @EventListener
    public void onDeploymentCompleted(DeploymentEvent event) {
        if (!"completed".equalsIgnoreCase(event.status())) return;
        log.info("Deployment completed: {} in environment {}", event.deploymentId(), event.environmentId());
        // Cross-module reaction: update service health in Observe module
        healthCheckService.recordHealth(
            "deployment." + event.deploymentId(),
            event.environmentId(),
            "healthy",
            0.0,
            100.0
        );
    }

    @EventListener
    public void onDeploymentFailed(DeploymentEvent event) {
        if (!"failed".equalsIgnoreCase(event.status())) return;
        log.warn("Deployment failed: {} in environment {}", event.deploymentId(), event.environmentId());
        // Cross-module reaction: record degraded health (auto-creates alert in HealthCheckService)
        healthCheckService.recordHealth(
            "deployment." + event.deploymentId(),
            event.environmentId(),
            "down",
            0.0,
            0.0
        );
    }

    @EventListener
    public void onHealthStateChanged(HealthStateEvent event) {
        log.info("Health state changed: {} from {} to {}",
            event.serviceName(), event.previousState(), event.newState());
        if ("unhealthy".equalsIgnoreCase(event.newState())) {
            // Cross-module reaction: create incident in AIOps module
            incidentService.createIncident(
                event.environmentId(),
                "Serviço " + event.serviceName() + " está unhealthy",
                "Saúde do serviço mudou de " + event.previousState() + " para " + event.newState(),
                "critical"
            );
        }
    }
}
