package com.cloudbuilder.shared.event.listener;

import com.cloudbuilder.aiops.domain.service.IncidentService;
import com.cloudbuilder.observe.domain.service.HealthCheckService;
import com.cloudbuilder.shared.event.config.InboxProcessor;
import com.cloudbuilder.shared.event.domain.DeploymentEvent;
import com.cloudbuilder.shared.event.domain.HealthStateEvent;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Kafka consumer for deployment lifecycle events (ADR-035 dual-mode).
 *
 * <p>Active when {@code cloudbuilder.kafka.enabled=true}.
 * Uses Inbox Pattern for deduplication before processing.
 */
@Component
@ConditionalOnProperty(name = "cloudbuilder.kafka.enabled", havingValue = "true", matchIfMissing = true)
public class DeploymentEventListenerKafka {

    private static final Logger log = LoggerFactory.getLogger(DeploymentEventListenerKafka.class);

    private final HealthCheckService healthCheckService;
    private final IncidentService incidentService;
    private final InboxProcessor inboxProcessor;

    public DeploymentEventListenerKafka(HealthCheckService healthCheckService,
                                        IncidentService incidentService,
                                        InboxProcessor inboxProcessor) {
        this.healthCheckService = healthCheckService;
        this.incidentService = incidentService;
        this.inboxProcessor = inboxProcessor;
    }

    @KafkaListener(
        topics = "${cloudbuilder.kafka.topics.deployment:deployment.events}",
        groupId = "cloudbuilder-deployment-listener",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void onDeployment(ConsumerRecord<String, Object> record) {
        if (record.value() instanceof DeploymentEvent event) {
            if (!inboxProcessor.tryAcquire(event.getEventId(), event.getEventType(), event.getTenantId())) return;

            if ("started".equalsIgnoreCase(event.status())) {
                log.info("Kafka deployment started: {} in environment {}", event.deploymentId(), event.environmentId());
            } else if ("completed".equalsIgnoreCase(event.status())) {
                log.info("Kafka deployment completed: {} in environment {}", event.deploymentId(), event.environmentId());
                healthCheckService.recordHealth(
                    "deployment." + event.deploymentId(),
                    event.environmentId(),
                    "healthy",
                    0.0,
                    100.0
                );
            } else if ("failed".equalsIgnoreCase(event.status())) {
                log.warn("Kafka deployment failed: {} in environment {}", event.deploymentId(), event.environmentId());
                healthCheckService.recordHealth(
                    "deployment." + event.deploymentId(),
                    event.environmentId(),
                    "down",
                    0.0,
                    0.0
                );
            }
        }

        if (record.value() instanceof HealthStateEvent event) {
            if (!inboxProcessor.tryAcquire(event.getEventId(), event.getEventType(), event.getTenantId())) return;

            log.info("Kafka health state changed: {} from {} to {}",
                event.serviceName(), event.previousState(), event.newState());
            if ("unhealthy".equalsIgnoreCase(event.newState())) {
                incidentService.createIncident(
                    event.environmentId(),
                    "Serviço " + event.serviceName() + " está unhealthy",
                    "Saúde do serviço mudou de " + event.previousState() + " para " + event.newState(),
                    "critical"
                );
            }
        }
    }
}
