package com.cloudbuilder.notification.infrastructure.webhook;

import com.cloudbuilder.notification.domain.model.Notification;
import com.cloudbuilder.notification.domain.service.NotificationDispatchService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class WebhookNotificationChannel {

    private static final Logger log = LoggerFactory.getLogger(WebhookNotificationChannel.class);

    private final NotificationDispatchService notificationService;

    public WebhookNotificationChannel(NotificationDispatchService notificationService) {
        this.notificationService = notificationService;
    }

    public void send(Notification notification, String webhookUrl) {
        try {
            log.info("Sending webhook notification to {}: {}", webhookUrl, notification.getTitle());

            String payload = String.format(
                "{\"event\":\"%s\",\"title\":\"%s\",\"body\":\"%s\",\"userId\":\"%s\",\"timestamp\":\"%s\"}",
                notification.getType(), notification.getTitle(), notification.getBody(),
                notification.getUserId(), Instant.now().toString()
            );

            // In production, this would make an HTTP POST to the webhook URL
            Thread.sleep(100);

            notificationService.markAsSent(notification.getId());
            log.info("Webhook notification sent successfully: {}", notification.getId());

        } catch (Exception e) {
            log.error("Failed to send webhook notification: {}", notification.getId(), e);
            notificationService.markAsFailed(notification.getId(), e.getMessage());
        }
    }
}
