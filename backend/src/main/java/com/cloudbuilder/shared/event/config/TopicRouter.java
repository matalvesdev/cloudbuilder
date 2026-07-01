package com.cloudbuilder.shared.event.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Routes PlatformEvent types to Kafka topics based on event type prefix.
 *
 * <p>Topic routing (ADR-035):
 * <pre>
 *   cost.anomaly        → cost.events
 *   deployment.started  → deployment.events
 *   drift.detected      → observability.events
 *   incident.created    → ai.events
 *   canvas.created      → canvas.events
 *   ...
 * </pre>
 *
 * Unknown prefixes default to {@code system.events}.
 */
@Component
public class TopicRouter {

    private final Map<String, String> topicMapping;

    public TopicRouter(@Value("${cloudbuilder.kafka.topics.cost:cost.events}") String costTopic,
                       @Value("${cloudbuilder.kafka.topics.deployment:deployment.events}") String deploymentTopic,
                       @Value("${cloudbuilder.kafka.topics.observability:observability.events}") String observabilityTopic,
                       @Value("${cloudbuilder.kafka.topics.ai:ai.events}") String aiTopic,
                       @Value("${cloudbuilder.kafka.topics.canvas:canvas.events}") String canvasTopic,
                       @Value("${cloudbuilder.kafka.topics.provisioning:provisioning.events}") String provisioningTopic,
                       @Value("${cloudbuilder.kafka.topics.security:security.events}") String securityTopic,
                       @Value("${cloudbuilder.kafka.topics.identity:identity.events}") String identityTopic,
                       @Value("${cloudbuilder.kafka.topics.audit:audit.events}") String auditTopic,
                       @Value("${cloudbuilder.kafka.topics.policy:policy.events}") String policyTopic,
                       @Value("${cloudbuilder.kafka.topics.notification:notification.events}") String notificationTopic,
                       @Value("${cloudbuilder.kafka.topics.system:system.events}") String systemTopic) {

        this.topicMapping = new HashMap<>();
        this.topicMapping.put("cost", costTopic);
        this.topicMapping.put("finops", costTopic);
        this.topicMapping.put("deployment", deploymentTopic);
        this.topicMapping.put("drift", observabilityTopic);
        this.topicMapping.put("health", observabilityTopic);
        this.topicMapping.put("observability", observabilityTopic);
        this.topicMapping.put("incident", aiTopic);
        this.topicMapping.put("aiops", aiTopic);
        this.topicMapping.put("canvas", canvasTopic);
        this.topicMapping.put("architecture", canvasTopic);
        this.topicMapping.put("terraform", canvasTopic);
        this.topicMapping.put("provisioning", provisioningTopic);
        this.topicMapping.put("resource", provisioningTopic);
        this.topicMapping.put("security", securityTopic);
        this.topicMapping.put("identity", identityTopic);
        this.topicMapping.put("user", identityTopic);
        this.topicMapping.put("audit", auditTopic);
        this.topicMapping.put("policy", policyTopic);
        this.topicMapping.put("notification", notificationTopic);
        this.topicMapping.put("system", systemTopic);
    }

    /**
     * Resolves the Kafka topic for a given event type string.
     *
     * @param eventType the event type (e.g., "cost.anomaly", "deployment.started")
     * @return the Kafka topic name (e.g., "cost.events", "deployment.events")
     */
    public String resolveTopic(String eventType) {
        if (eventType == null || eventType.isBlank()) {
            return topicMapping.get("system");
        }
        // Extract first segment: "cost.anomaly" → "cost"
        String prefix = eventType.contains(".") ? eventType.substring(0, eventType.indexOf('.')) : eventType;
        return topicMapping.getOrDefault(prefix, topicMapping.get("system"));
    }
}
