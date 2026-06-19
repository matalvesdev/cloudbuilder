package com.cloudbuilder.observability.domain.service;

import com.cloudbuilder.observability.domain.model.AlertRuleEntity;
import com.cloudbuilder.observability.domain.model.IncidentEntity;
import com.cloudbuilder.observability.domain.model.NotificationChannelEntity;
import com.cloudbuilder.observability.domain.port.NotificationChannelRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

@Service
public class NotificationService {

    private final NotificationChannelRepository channelRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public NotificationService(NotificationChannelRepository channelRepository,
                               ObjectMapper objectMapper) {
        this.channelRepository = channelRepository;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();
    }

    public void sendNotification(IncidentEntity incident, AlertRuleEntity rule) {
        if (rule.getNotifyChannels() == null || rule.getNotifyChannels().isBlank()) {
            return; // No channels configured
        }

        try {
            String channelsJson = rule.getNotifyChannels();
            // Simple JSON array parsing — expects ["channel-id-1", "channel-id-2"]
            String[] channelIds = objectMapper.readValue(channelsJson, String[].class);

            for (String channelId : channelIds) {
                channelRepository.findById(channelId)
                    .ifPresent(channel -> sendToChannel(channel, incident, rule));
            }
        } catch (Exception e) {
            System.err.printf("Failed to send notification for incident %s: %s%n",
                incident.getId(), e.getMessage());
        }
    }

    private void sendToChannel(NotificationChannelEntity channel, IncidentEntity incident,
                                AlertRuleEntity rule) {
        try {
            Map<String, Object> payload = Map.of(
                "event", "incident",
                "incidentId", incident.getId().toString(),
                "title", incident.getTitle(),
                "severity", incident.getSeverity(),
                "status", incident.getStatus(),
                "metric", rule.getMetricName(),
                "value", incident.getCurrentValue(),
                "threshold", incident.getThreshold(),
                "timestamp", incident.getStartedAt().toString()
            );

            String body = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(channel.getConfig()))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .timeout(Duration.ofSeconds(5))
                .build();

            httpClient.sendAsync(request, HttpResponse.BodyHandlers.discarding());
        } catch (Exception e) {
            System.err.printf("Failed to notify channel %s: %s%n", channel.getName(), e.getMessage());
        }
    }
}
