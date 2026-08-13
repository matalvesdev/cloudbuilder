package com.cloudbuilder.notification.application.dto;

import com.cloudbuilder.notification.domain.model.Notification;
import java.time.Instant;

public record NotificationDTO(
    String id,
    String tenantId,
    String userId,
    Notification.NotificationType type,
    Notification.NotificationChannel channel,
    String title,
    String body,
    Notification.NotificationStatus status,
    Instant createdAt,
    Instant sentAt,
    Instant readAt
) {
    public static NotificationDTO from(Notification n) {
        return new NotificationDTO(
            n.getId(), n.getTenantId(), n.getUserId(),
            n.getType(), n.getChannel(), n.getTitle(), n.getBody(),
            n.getStatus(), n.getCreatedAt(), n.getSentAt(), n.getReadAt()
        );
    }
}
