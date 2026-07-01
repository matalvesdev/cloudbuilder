package com.cloudbuilder.shared.event.config;

import com.cloudbuilder.shared.event.PlatformEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;

import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KafkaEventPublisherTest {

    @Mock
    private KafkaTemplate<String, Object> kafkaTemplate;

    @Mock
    private TopicRouter topicRouter;

    @Mock
    private EventMetrics eventMetrics;

    private KafkaEventPublisher publisher;

    @BeforeEach
    void setUp() {
        publisher = new KafkaEventPublisher(kafkaTemplate, topicRouter, eventMetrics);
    }

    @Test
    void publish_ShouldRouteToCorrectTopic() {
        PlatformEvent event = new PlatformEvent();
        event.setEventType("cost.anomaly");
        event.setTenantId("tenant-1");
        event.setEventId("evt-123");

        when(topicRouter.resolveTopic("cost.anomaly")).thenReturn("cost.events");
        when(kafkaTemplate.send(any(String.class), any(String.class), any()))
            .thenReturn(CompletableFuture.completedFuture(mock(SendResult.class)));

        publisher.publish(event);

        verify(topicRouter).resolveTopic("cost.anomaly");
        verify(kafkaTemplate).send(eq("cost.events"), eq("tenant-1:evt-123"), eq(event));
    }

    @Test
    void publish_OnSuccess_ShouldRecordMetrics() {
        PlatformEvent event = new PlatformEvent();
        event.setEventType("deployment.started");
        event.setTenantId("tenant-1");
        event.setEventId("evt-456");

        SendResult<String, Object> sendResult = mock(SendResult.class);
        org.apache.kafka.clients.producer.RecordMetadata metadata =
            mock(org.apache.kafka.clients.producer.RecordMetadata.class);
        when(sendResult.getRecordMetadata()).thenReturn(metadata);
        when(metadata.partition()).thenReturn(0);
        when(metadata.offset()).thenReturn(0L);

        when(topicRouter.resolveTopic("deployment.started")).thenReturn("deployment.events");
        when(kafkaTemplate.send(any(), any(), any()))
            .thenReturn(CompletableFuture.completedFuture(sendResult));

        publisher.publish(event);

        // Wait for async completion
        Thread.sleep(100);
        verify(eventMetrics).recordPublished();
    }

    @Test
    void publish_PublishKey_ShouldContainTenantAndEventId() {
        PlatformEvent event = new PlatformEvent();
        event.setEventType("drift.detected");
        event.setTenantId("tenant-42");
        event.setEventId("drift-789");

        when(topicRouter.resolveTopic("drift.detected")).thenReturn("observability.events");
        when(kafkaTemplate.send(any(), any(), any()))
            .thenReturn(CompletableFuture.completedFuture(mock(SendResult.class)));

        publisher.publish(event);

        verify(kafkaTemplate).send(eq("observability.events"), eq("tenant-42:drift-789"), eq(event));
    }
}
