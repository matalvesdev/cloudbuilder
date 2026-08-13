package com.cloudbuilder.notification.infrastructure.config;

import com.cloudbuilder.shared.event.domain.DeploymentEvent;
import com.cloudbuilder.notification.domain.model.Notification;
import com.cloudbuilder.notification.domain.service.NotificationDispatchService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class NotificationEventListener {

    private static final Logger log = LoggerFactory.getLogger(NotificationEventListener.class);

    private final NotificationDispatchService notificationService;

    public NotificationEventListener(NotificationDispatchService notificationService) {
        this.notificationService = notificationService;
    }

    @Async
    @EventListener
    public void handleDeploymentEvent(DeploymentEvent event) {
        Notification.NotificationType type;
        String title;
        String body;

        switch (event.status()) {
            case "provisioning", "deploying" -> {
                type = Notification.NotificationType.DEPLOYMENT_STARTED;
                title = "Deployment Started";
                body = "Deployment " + event.deploymentId() + " has been started.";
            }
            case "completed" -> {
                type = Notification.NotificationType.DEPLOYMENT_COMPLETED;
                title = "Deployment Completed";
                body = "Deployment " + event.deploymentId() + " completed successfully.";
            }
            case "failed" -> {
                type = Notification.NotificationType.DEPLOYMENT_FAILED;
                title = "Deployment Failed";
                body = "Deployment " + event.deploymentId() + " failed: " + event.message();
            }
            default -> {
                log.debug("Ignoring deployment event with status: {}", event.status());
                return;
            }
        }

        try {
            notificationService.createNotification(
                event.tenantId(), "system", type,
                Notification.NotificationChannel.IN_APP, title, body
            );
            log.info("Notification created for deployment event: {}", event.deploymentId());
        } catch (Exception e) {
            log.error("Failed to create notification for deployment event", e);
        }
    }
}
