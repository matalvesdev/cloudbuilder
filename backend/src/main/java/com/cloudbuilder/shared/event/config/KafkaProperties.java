package com.cloudbuilder.shared.event.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for Kafka topics and connection.
 * Bound from {@code cloudbuilder.kafka.*} in application.yml.
 */
@Component
@ConfigurationProperties(prefix = "cloudbuilder.kafka")
public class KafkaProperties {

    private boolean enabled = true;
    private String bootstrapServers = "localhost:9092";
    private int replicationFactor = 1;
    private Producer producer = new Producer();
    private Consumer consumer = new Consumer();
    private Topics topics = new Topics();
    private SchemaRegistry schemaRegistry = new SchemaRegistry();

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public String getBootstrapServers() { return bootstrapServers; }
    public void setBootstrapServers(String bootstrapServers) { this.bootstrapServers = bootstrapServers; }
    public int getReplicationFactor() { return replicationFactor; }
    public void setReplicationFactor(int replicationFactor) { this.replicationFactor = replicationFactor; }
    public Producer getProducer() { return producer; }
    public void setProducer(Producer producer) { this.producer = producer; }
    public Consumer getConsumer() { return consumer; }
    public void setConsumer(Consumer consumer) { this.consumer = consumer; }
    public Topics getTopics() { return topics; }
    public void setTopics(Topics topics) { this.topics = topics; }
    public SchemaRegistry getSchemaRegistry() { return schemaRegistry; }
    public void setSchemaRegistry(SchemaRegistry schemaRegistry) { this.schemaRegistry = schemaRegistry; }

    public static class Producer {
        private String acks = "all";
        private int retries = 3;
        public String getAcks() { return acks; }
        public void setAcks(String acks) { this.acks = acks; }
        public int getRetries() { return retries; }
        public void setRetries(int retries) { this.retries = retries; }
    }

    public static class Consumer {
        private String groupId = "cloudbuilder-backend";
        private String autoOffsetReset = "earliest";
        public String getGroupId() { return groupId; }
        public void setGroupId(String groupId) { this.groupId = groupId; }
        public String getAutoOffsetReset() { return autoOffsetReset; }
        public void setAutoOffsetReset(String autoOffsetReset) { this.autoOffsetReset = autoOffsetReset; }
    }

    public static class Topics {
        private String canvas = "canvas.events";
        private String deployment = "deployment.events";
        private String observability = "observability.events";
        private String ai = "ai.events";
        private String provisioning = "provisioning.events";
        private String security = "security.events";
        private String identity = "identity.events";
        private String audit = "audit.events";
        private String cost = "cost.events";
        private String policy = "policy.events";
        private String notification = "notification.events";
        private String system = "system.events";

        public String getCanvas() { return canvas; }
        public void setCanvas(String canvas) { this.canvas = canvas; }
        public String getDeployment() { return deployment; }
        public void setDeployment(String deployment) { this.deployment = deployment; }
        public String getObservability() { return observability; }
        public void setObservability(String observability) { this.observability = observability; }
        public String getAi() { return ai; }
        public void setAi(String ai) { this.ai = ai; }
        public String getProvisioning() { return provisioning; }
        public void setProvisioning(String provisioning) { this.provisioning = provisioning; }
        public String getSecurity() { return security; }
        public void setSecurity(String security) { this.security = security; }
        public String getIdentity() { return identity; }
        public void setIdentity(String identity) { this.identity = identity; }
        public String getAudit() { return audit; }
        public void setAudit(String audit) { this.audit = audit; }
        public String getCost() { return cost; }
        public void setCost(String cost) { this.cost = cost; }
        public String getPolicy() { return policy; }
        public void setPolicy(String policy) { this.policy = policy; }
        public String getNotification() { return notification; }
        public void setNotification(String notification) { this.notification = notification; }
        public String getSystem() { return system; }
        public void setSystem(String system) { this.system = system; }
    }

    public static class SchemaRegistry {
        private boolean enabled = false;
        private String url = "http://localhost:8081";
        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }
        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }
    }
}
