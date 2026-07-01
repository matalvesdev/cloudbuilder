package com.cloudbuilder.shared.event.config;

import com.cloudbuilder.shared.event.PlatformEvent;
import com.cloudbuilder.shared.event.domain.DlqEvent;
import com.cloudbuilder.shared.event.domain.DlqEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DLQHandlerTest {

    @Mock
    private DlqEventRepository dlqEventRepository;

    @Mock
    private EventMetrics eventMetrics;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private DLQHandler handler;

    @BeforeEach
    void setUp() {
        handler = new DLQHandler(dlqEventRepository, objectMapper, eventMetrics);
    }

    @Test
    void handleDlq_ShouldPersistEvent() {
        PlatformEvent event = new PlatformEvent();
        event.setEventType("cost.anomaly");
        event.setTenantId("tenant-1");

        ConsumerRecord<String, Object> record = new ConsumerRecord<>(
            "cost.events.dlq", 0, 42L, "key-123", event);

        handler.handleDlq(record);

        verify(dlqEventRepository).save(any(DlqEvent.class));
        verify(eventMetrics).recordListenerFailure();
    }

    @Test
    void handleDlq_ShouldExtractTopicPrefix() {
        PlatformEvent event = new PlatformEvent();
        event.setEventType("deployment.started");
        event.setTenantId("tenant-2");

        ConsumerRecord<String, Object> record = new ConsumerRecord<>(
            "deployment.events.dlq", 1, 100L, "key-456", event);

        handler.handleDlq(record);

        var captor = org.mockito.ArgumentCaptor.forClass(DlqEvent.class);
        verify(dlqEventRepository).save(captor.capture());
        DlqEvent saved = captor.getValue();
        assertEquals("deployment.events", saved.getOriginalTopic());
        assertEquals(1, saved.getPartition());
        assertEquals(100L, saved.getOffset());
    }

    @Test
    void handleDlq_RepositoryFailure_ShouldNotThrow() {
        ConsumerRecord<String, Object> record = new ConsumerRecord<>(
            "cost.events.dlq", 0, 0L, "key", new PlatformEvent());

        when(dlqEventRepository.save(any())).thenThrow(new RuntimeException("DB down"));

        // Should not throw
        assertDoesNotThrow(() -> handler.handleDlq(record));
    }
}
