package com.cloudbuilder.notification.infrastructure.slack;

import com.cloudbuilder.notification.domain.model.Notification;
import com.cloudbuilder.notification.domain.service.NotificationDispatchService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class SlackNotificationChannel {

    private static final Logger log = LoggerFactory.getLogger(SlackNotificationChannel.class);

    private final NotificationDispatchService notificationService;

    public SlackNotificationChannel(NotificationDispatchService notificationService) {
        this.notificationService = notificationService;
    }

    public void send(Notification notification) {
        try {
            // In production, this would call the Slack API
            log.info("Sending Slack notification to user {}: {}",
                notification.getUserId(), notification.getTitle());

            // Build Slack message payload
            String payload = String.format(
                "{\"channel\":\"#notifications\",\"text\":\"%s\",\"attachments\":[{\"title\":\"%s\",\"text\":\"%s\"}]}",
                notification.getTitle(), notification.getTitle(), notification.getBody()
            );

            // Simulate Slack API call
            Thread.sleep(100);

            notificationService.markAsSent(notification.getId());
            log.info("Slack notification sent successfully: {}", notification.getId());

        } catch (Exception e) {
            log.error("Failed to send Slack notification: {}", notification.getId(), e);
            notificationService.markAsFailed(notification.getId(), e.getMessage());
        }
    }
}
