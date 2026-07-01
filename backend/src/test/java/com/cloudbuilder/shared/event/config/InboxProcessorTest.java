package com.cloudbuilder.shared.event.config;

import com.cloudbuilder.shared.event.PlatformEvent;
import com.cloudbuilder.shared.event.domain.EventInbox;
import com.cloudbuilder.shared.event.domain.EventInboxRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InboxProcessorTest {

    @Mock
    private EventInboxRepository inboxRepository;

    private InboxProcessor processor;

    @BeforeEach
    void setUp() {
        processor = new InboxProcessor(inboxRepository);
    }

    @Test
    void tryAcquire_NewEvent_ShouldInsertAndReturnTrue() {
        String eventId = UUID.randomUUID().toString();
        when(inboxRepository.existsByEventId(eventId)).thenReturn(false);

        boolean result = processor.tryAcquire(eventId, "cost.anomaly", "tenant-1");

        assertTrue(result);
        verify(inboxRepository).existsByEventId(eventId);
        verify(inboxRepository).save(any(EventInbox.class));
    }

    @Test
    void tryAcquire_DuplicateEvent_ShouldReturnFalse() {
        String eventId = UUID.randomUUID().toString();
        when(inboxRepository.existsByEventId(eventId)).thenReturn(true);

        boolean result = processor.tryAcquire(eventId, "cost.anomaly", "tenant-1");

        assertFalse(result);
        verify(inboxRepository).existsByEventId(eventId);
        verify(inboxRepository, never()).save(any(EventInbox.class));
    }

    @Test
    void tryAcquire_MultipleCalls_ShouldHandleCorrectly() {
        String eventId1 = UUID.randomUUID().toString();
        String eventId2 = UUID.randomUUID().toString();

        when(inboxRepository.existsByEventId(eventId1)).thenReturn(false);
        when(inboxRepository.existsByEventId(eventId2)).thenReturn(true);

        assertTrue(processor.tryAcquire(eventId1, "deployment.started", "tenant-1"));
        assertFalse(processor.tryAcquire(eventId2, "deployment.completed", "tenant-1"));

        verify(inboxRepository).save(any(EventInbox.class));
    }

    @Test
    void cleanup_ShouldCallRepositoryDeleteOlderThan() {
        processor.cleanup();

        verify(inboxRepository).deleteOlderThan(any(Instant.class));
    }
}
