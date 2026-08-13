package com.cloudbuilder.notification.domain.service;

import com.cloudbuilder.notification.domain.model.Notification;
import com.cloudbuilder.notification.domain.model.NotificationTemplate;
import com.cloudbuilder.notification.domain.port.NotificationRepository;
import com.cloudbuilder.notification.domain.port.NotificationTemplateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;

@Service
public class NotificationDispatchService {

    private final NotificationRepository notificationRepo;
    private final NotificationTemplateRepository templateRepo;

    public NotificationDispatchService(NotificationRepository notificationRepo,
                               NotificationTemplateRepository templateRepo) {
        this.notificationRepo = notificationRepo;
        this.templateRepo = templateRepo;
    }

    @Transactional
    public Notification createNotification(String tenantId, String userId,
                                           Notification.NotificationType type,
                                           Notification.NotificationChannel channel,
                                           String title, String body) {
        Notification notification = new Notification(tenantId, userId, type, channel, title, body);
        return notificationRepo.save(notification);
    }

    @Transactional
    public Notification createFromTemplate(String tenantId, String userId,
                                           String templateCode, Map<String, String> variables) {
        Optional<NotificationTemplate> templateOpt = templateRepo.findByTenantIdAndCode(tenantId, templateCode);
        if (templateOpt.isEmpty()) {
            throw new RuntimeException("Template not found: " + templateCode);
        }

        NotificationTemplate template = templateOpt.get();
        String subject = renderTemplate(template.getSubjectTemplate(), variables);
        String body = renderTemplate(template.getBodyTemplate(), variables);

        Notification notification = new Notification(
            tenantId, userId,
            Notification.NotificationType.SYSTEM,
            template.getChannel(),
            subject, body
        );
        notification.setTemplateId(template.getId());

        return notificationRepo.save(notification);
    }

    @Transactional
    public void markAsSent(String notificationId) {
        notificationRepo.findById(notificationId).ifPresent(n -> {
            n.markSent();
            notificationRepo.save(n);
        });
    }

    @Transactional
    public void markAsRead(String notificationId) {
        notificationRepo.findById(notificationId).ifPresent(n -> {
            n.markRead();
            notificationRepo.save(n);
        });
    }

    @Transactional
    public void markAsFailed(String notificationId, String error) {
        notificationRepo.findById(notificationId).ifPresent(n -> {
            n.markFailed(error);
            notificationRepo.save(n);
        });
    }

    public long getUnreadCount(String tenantId, String userId) {
        return notificationRepo.countByTenantIdAndUserIdAndStatusNot(
            tenantId, userId, Notification.NotificationStatus.READ);
    }

    private String renderTemplate(String template, Map<String, String> variables) {
        String result = template;
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            result = result.replace("{{" + entry.getKey() + "}}", entry.getValue());
        }
        return result;
    }
}
