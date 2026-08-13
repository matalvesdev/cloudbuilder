package com.cloudbuilder.notification.infrastructure.email;

import com.cloudbuilder.notification.domain.model.Notification;
import com.cloudbuilder.notification.domain.service.NotificationDispatchService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class EmailNotificationChannel {

    private static final Logger log = LoggerFactory.getLogger(EmailNotificationChannel.class);

    private final NotificationDispatchService notificationService;

    public EmailNotificationChannel(NotificationDispatchService notificationService) {
        this.notificationService = notificationService;
    }

    public void send(Notification notification) {
        try {
            // In production, this would integrate with an email service (SendGrid, SES, etc.)
            log.info("Sending email notification to user {}: {}",
                notification.getUserId(), notification.getTitle());

            // Simulate email sending
            Thread.sleep(100);

            notificationService.markAsSent(notification.getId());
            log.info("Email notification sent successfully: {}", notification.getId());

        } catch (Exception e) {
            log.error("Failed to send email notification: {}", notification.getId(), e);
            notificationService.markAsFailed(notification.getId(), e.getMessage());
        }
    }
}
