package com.cloudbuilder.observability.domain.service;

import com.cloudbuilder.observability.domain.model.AlertRuleEntity;
import com.cloudbuilder.observability.domain.model.IncidentEntity;
import com.cloudbuilder.observability.domain.model.NotificationChannelEntity;
import com.cloudbuilder.observability.domain.port.NotificationChannelRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationChannelRepository channelRepository;

    private ObjectMapper objectMapper;
    private NotificationService notificationService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        notificationService = new NotificationService(channelRepository, objectMapper);
    }

    @Test
    void sendNotification_WithNoChannels_ShouldSkip() {
        var incident = new IncidentEntity(UUID.randomUUID().toString(), "t1", "Test", "Desc", "CRITICAL", 95.0, 90.0);
        var rule = new AlertRuleEntity();

        // Should not throw and no interaction with repository
        notificationService.sendNotification(incident, rule);
        verifyNoInteractions(channelRepository);
    }

    @Test
    void sendNotification_WithEmptyChannels_ShouldSkip() {
        var incident = new IncidentEntity(UUID.randomUUID().toString(), "t1", "Test", "Desc", "CRITICAL", 95.0, 90.0);
        var rule = new AlertRuleEntity();
        rule.setNotifyChannels("");

        notificationService.sendNotification(incident, rule);
        verifyNoInteractions(channelRepository);
    }

    @Test
    void sendNotification_WithValidChannel_ShouldLookupAndSend() throws Exception {
        var incident = new IncidentEntity(UUID.randomUUID().toString(), "t1", "Incident Title", "Desc", "CRITICAL", 95.0, 90.0);
        incident.setStatus("OPEN");
        incident.setStartedAt(Instant.now());
        var rule = new AlertRuleEntity();
        rule.setMetricName("cpu.usage");
        rule.setNotifyChannels("[\"" + UUID.randomUUID().toString() + "\"]");
        var channel = new NotificationChannelEntity();
        channel.setName("webhook");
        channel.setConfig("http://localhost:9999/webhook");

        when(channelRepository.findById(any(String.class))).thenReturn(Optional.of(channel));

        notificationService.sendNotification(incident, rule);

        verify(channelRepository, times(1)).findById(any(String.class));
    }

    @Test
    void sendNotification_WithInvalidChannelId_ShouldNotThrow() {
        var incident = new IncidentEntity(UUID.randomUUID().toString(), "t1", "Test", "Desc", "CRITICAL", 95.0, 90.0);
        var rule = new AlertRuleEntity();
        rule.setNotifyChannels("[\"not-a-uuid\"]");

        assertDoesNotThrow(() -> notificationService.sendNotification(incident, rule));
    }

    @Test
    void sendNotification_WithNonExistentChannel_ShouldSkip() {
        var incident = new IncidentEntity(UUID.randomUUID().toString(), "t1", "Test", "Desc", "CRITICAL", 95.0, 90.0);
        var rule = new AlertRuleEntity();
        rule.setNotifyChannels("[\"" + UUID.randomUUID().toString() + "\"]");

        when(channelRepository.findById(any(String.class))).thenReturn(Optional.empty());

        assertDoesNotThrow(() -> notificationService.sendNotification(incident, rule));
    }
}
