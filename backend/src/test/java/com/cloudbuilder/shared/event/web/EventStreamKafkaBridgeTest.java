package com.cloudbuilder.shared.event.web;

import com.cloudbuilder.shared.event.PlatformEvent;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EventStreamKafkaBridgeTest {

    @Mock
    private ApplicationEventPublisher eventPublisher;

    private EventStreamKafkaBridge bridge;

    @BeforeEach
    void setUp() {
        bridge = new EventStreamKafkaBridge(eventPublisher);
    }

    @Test
    void onKafkaEvent_PlatformEvent_ShouldRepublish() {
        PlatformEvent event = new PlatformEvent();
        event.setEventType("cost.anomaly");
        event.setTenantId("tenant-1");

        ConsumerRecord<String, Object> record = new ConsumerRecord<>(
            "cost.events", 0, 10L, "key", event);

        bridge.onKafkaEvent(record);

        verify(eventPublisher).publishEvent(event);
    }

    @Test
    void onKafkaEvent_NullValue_ShouldNotRepublish() {
        ConsumerRecord<String, Object> record = new ConsumerRecord<>(
            "cost.events", 0, 10L, "key", null);

        bridge.onKafkaEvent(record);

        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    void onKafkaEvent_NonPlatformEvent_ShouldNotRepublish() {
        ConsumerRecord<String, Object> record = new ConsumerRecord<>(
            "cost.events", 0, 10L, "key", "not a platform event");

        bridge.onKafkaEvent(record);

        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    void onKafkaEvent_MultipleEvents_ShouldRepublishAll() {
        for (int i = 0; i < 5; i++) {
            PlatformEvent event = new PlatformEvent();
            event.setEventType("deployment.started");
            event.setTenantId("tenant-" + i);

            ConsumerRecord<String, Object> record = new ConsumerRecord<>(
                "deployment.events", 0, i, "key-" + i, event);

            bridge.onKafkaEvent(record);
        }

        verify(eventPublisher, times(5)).publishEvent(any(PlatformEvent.class));
    }
}
