package com.cloudbuilder.shared.event.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.cloudbuilder.shared.event.listener.InboxProcessor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EventStreamKafkaBridgeTest {

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private InboxProcessor inboxProcessor;

    private EventStreamKafkaBridge bridge;

    @BeforeEach
    void setUp() {
        bridge = new EventStreamKafkaBridge(eventPublisher, new ObjectMapper(), inboxProcessor);
    }

    @Test
    void onMessage_ValidMessage_ShouldPublish() throws InterruptedException {
        bridge.onMessage("{\"eventType\":\"cost.anomaly\",\"tenantId\":\"tenant-1\"}", "cost.events", 0, 0L);
        Thread.sleep(500);
        verify(eventPublisher, atLeastOnce()).publishEvent(any(Object.class));
    }

    @Test
    void onMessage_EmptyString_ShouldThrowOrNotPublish() {
        // Empty string causes Jackson parse error — method throws IllegalArgumentException
        assertThrows(IllegalArgumentException.class, () ->
            bridge.onMessage("", "unknown", 0, 0L));
    }

    @Test
    void onMessage_MultipleEvents_ShouldPublishEach() throws InterruptedException {
        for (int i = 0; i < 3; i++) {
            bridge.onMessage("{\"eventType\":\"deployment.started\",\"tenantId\":\"tenant-" + i + "\"}", "deployment.events", 0, i);
        }
        Thread.sleep(500);
        verify(eventPublisher, times(3)).publishEvent(any(Object.class));
    }
}
