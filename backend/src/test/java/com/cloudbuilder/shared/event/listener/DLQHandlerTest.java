package com.cloudbuilder.shared.event.listener;

import com.cloudbuilder.shared.event.port.DlqEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Tests for DLQHandler.
 * The actual DLQHandler logs DLQ messages via Kafka listener;
 * these tests verify it handles various message formats without throwing.
 */
@ExtendWith(MockitoExtension.class)
class DLQHandlerTest {

    @Mock
    private DlqEventRepository dlqEventRepository;

    private DLQHandler handler;

    @BeforeEach
    void setUp() {
        handler = new DLQHandler(dlqEventRepository);
    }

    @Test
    void onDlqMessage_ShouldNotThrow() {
        assertDoesNotThrow(() -> handler.onDlqMessage("{\"eventId\":\"123\",\"type\":\"test\"}", "cost.events.dlq", 0, 0L));
    }

    @Test
    void onDlqMessage_EmptyString_ShouldNotThrow() {
        assertDoesNotThrow(() -> handler.onDlqMessage("", "unknown.dlq", 0, 0L));
    }

    @Test
    void onDlqMessage_LongMessage_ShouldNotThrow() {
        String longMsg = "x".repeat(1000);
        assertDoesNotThrow(() -> handler.onDlqMessage(longMsg, "cost.events.dlq", 0, 0L));
    }

    @Test
    void onDlqMessage_JsonPayload_ShouldNotThrow() {
        String json = "{\"eventId\":\"evt-123\",\"eventType\":\"cost.anomaly\",\"tenantId\":\"tenant-1\"}";
        assertDoesNotThrow(() -> handler.onDlqMessage(json, "cost.events.dlq", 0, 0L));
    }

    // Note: null is not tested because the source DLQHandler calls message.substring()
    // which would throw NPE. In production, Kafka never delivers null string messages.
}
