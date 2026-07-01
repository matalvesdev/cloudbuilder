package com.cloudbuilder.shared.event.config;

import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.AdminClientConfig;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.*;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.support.serializer.ErrorHandlingDeserializer;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.kafka.support.serializer.JsonSerializer;
import org.springframework.util.backoff.FixedBackOff;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * Spring Kafka configuration (ADR-035).
 *
 * Activated only when {@code cloudbuilder.kafka.enabled=true} (default).
 * Provides:
 * - ProducerFactory + KafkaTemplate (JSON serialization, acks=all)
 * - ConsumerFactory + ConcurrentKafkaListenerContainerFactory (group, JSON deserialization)
 * - AdminClient for auto-creating topics on startup
 * - DefaultErrorHandler with DLQ routing on 3 failures
 */
@Configuration
@ConditionalOnProperty(name = "cloudbuilder.kafka.enabled", havingValue = "true", matchIfMissing = true)
public class KafkaConfig {

    private static final Logger log = LoggerFactory.getLogger(KafkaConfig.class);

    private final KafkaProperties props;

    public KafkaConfig(KafkaProperties props) {
        this.props = props;
    }

    // ── Producer ──────────────────────────────────────────────────────

    @Bean
    public ProducerFactory<String, Object> producerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, props.getBootstrapServers());
        config.put(ProducerConfig.ACKS_CONFIG, props.getProducer().getAcks());
        config.put(ProducerConfig.RETRIES_CONFIG, props.getProducer().getRetries());
        config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        config.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        config.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, 5);

        // Apicurio Schema Registry (if enabled)
        if (props.getSchemaRegistry() != null && props.getSchemaRegistry().isEnabled()) {
            config.put("apicurio.registry.url", props.getSchemaRegistry().getUrl());
            config.put("apicurio.registry.auto-registration", "true");
            log.info("Apicurio Schema Registry enabled: {}", props.getSchemaRegistry().getUrl());
        }

        return new DefaultKafkaProducerFactory<>(config);
    }

    @Bean
    public KafkaTemplate<String, Object> kafkaTemplate() {
        KafkaTemplate<String, Object> template = new KafkaTemplate<>(producerFactory());
        template.setObservationEnabled(true);
        return template;
    }

    // ── Consumer ──────────────────────────────────────────────────────

    @Bean
    public ConsumerFactory<String, Object> consumerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, props.getBootstrapServers());
        config.put(ConsumerConfig.GROUP_ID_CONFIG, props.getConsumer().getGroupId());
        config.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, props.getConsumer().getAutoOffsetReset());
        config.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);

        // ErrorHandlingDeserializer wrapping StringDeserializer for keys
        config.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, ErrorHandlingDeserializer.class);
        config.put(ErrorHandlingDeserializer.KEY_DESERIALIZER_CLASS, StringDeserializer.class);

        // ErrorHandlingDeserializer wrapping JsonDeserializer for values
        config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, ErrorHandlingDeserializer.class);
        config.put(ErrorHandlingDeserializer.VALUE_DESERIALIZER_CLASS, JsonDeserializer.class);
        config.put(JsonDeserializer.TRUSTED_PACKAGES, "com.cloudbuilder.*");
        config.put(JsonDeserializer.USE_TYPE_INFO_HEADERS, false);

        return new DefaultKafkaConsumerFactory<>(config);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, Object> kafkaListenerContainerFactory() {
        var factory = new ConcurrentKafkaListenerContainerFactory<String, Object>();
        factory.setConsumerFactory(consumerFactory());
        factory.setConcurrency(3);

        // DLQ routing: after 3 failures, send to topic.dlq and stop
        factory.setCommonErrorHandler(new DefaultErrorHandler(
            new org.springframework.kafka.listener.DeadLetterPublishingRecoverer(kafkaTemplate()),
            new FixedBackOff(1000L, 2L) // 1s initial, 2 attempts
        ));

        factory.getContainerProperties().setObservationEnabled(true);
        return factory;
    }

    // ── AdminClient for topic auto-creation ───────────────────────────

    @Bean
    public AdminClient kafkaAdminClient() {
        Map<String, Object> config = new HashMap<>();
        config.put(AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, props.getBootstrapServers());
        return AdminClient.create(config);
    }

    @Bean
    public TopicInitializer topicInitializer(AdminClient adminClient) {
        return new TopicInitializer(adminClient, props);
    }

    /**
     * Creates missing Kafka topics on application startup.
     */
    public static class TopicInitializer implements org.springframework.context.ApplicationListener<org.springframework.context.event.ContextRefreshedEvent> {

        private final AdminClient adminClient;
        private final KafkaProperties props;

        public TopicInitializer(AdminClient adminClient, KafkaProperties props) {
            this.adminClient = adminClient;
            this.props = props;
        }

        @Override
        public void onApplicationEvent(org.springframework.context.event.ContextRefreshedEvent event) {
            try {
                Set<String> existing = adminClient.listTopics().names().get();
                var topics = props.getTopics();
                var allTopics = new HashMap<String, String>();
                allTopics.put("canvas", topics.getCanvas());
                allTopics.put("deployment", topics.getDeployment());
                allTopics.put("observability", topics.getObservability());
                allTopics.put("ai", topics.getAi());
                allTopics.put("provisioning", topics.getProvisioning());
                allTopics.put("security", topics.getSecurity());
                allTopics.put("identity", topics.getIdentity());
                allTopics.put("audit", topics.getAudit());
                allTopics.put("cost", topics.getCost());
                allTopics.put("policy", topics.getPolicy());
                allTopics.put("notification", topics.getNotification());
                allTopics.put("system", topics.getSystem());

                var toCreate = allTopics.values().stream()
                    .filter(name -> !existing.contains(name))
                    .map(name -> new NewTopic(name, 3, (short) props.getReplicationFactor()))
                    .toList();

                if (!toCreate.isEmpty()) {
                    adminClient.createTopics(toCreate).all().get();
                    log.info("Kafka topics created: {}", toCreate.stream().map(NewTopic::name).toList());
                }
            } catch (Exception e) {
                log.warn("Could not auto-create Kafka topics (Kafka may not be running): {}", e.getMessage());
            }
        }
    }
}
