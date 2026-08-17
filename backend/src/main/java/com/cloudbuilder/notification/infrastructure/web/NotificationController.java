package com.cloudbuilder.notification.infrastructure.web;

import com.cloudbuilder.notification.application.dto.NotificationDTO;
import com.cloudbuilder.notification.domain.model.Notification;
import com.cloudbuilder.notification.domain.port.NotificationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@PreAuthorize("isAuthenticated()")
public class NotificationController {

    private final NotificationRepository notificationRepo;

    public NotificationController(NotificationRepository notificationRepo) {
        this.notificationRepo = notificationRepo;
    }

    @GetMapping
    public ResponseEntity<Page<NotificationDTO>> list(
            @RequestParam String tenantId,
            @RequestParam String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Notification> notifications = notificationRepo
            .findByTenantIdAndUserIdOrderByCreatedAtDesc(tenantId, userId, PageRequest.of(page, size));
        return ResponseEntity.ok(notifications.map(NotificationDTO::from));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(
            @RequestParam String tenantId,
            @RequestParam String userId) {
        long count = notificationRepo
            .countByTenantIdAndUserIdAndStatusNot(tenantId, userId, Notification.NotificationStatus.READ);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable String id) {
        notificationRepo.findById(id).ifPresent(n -> {
            n.markRead();
            notificationRepo.save(n);
        });
        return ResponseEntity.ok().build();
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(
            @RequestParam String tenantId,
            @RequestParam String userId) {
        notificationRepo.findByTenantIdAndUserIdOrderByCreatedAtDesc(
            tenantId, userId, PageRequest.of(0, 1000))
            .forEach(n -> {
                if (n.getStatus() != Notification.NotificationStatus.READ) {
                    n.markRead();
                    notificationRepo.save(n);
                }
            });
        return ResponseEntity.ok().build();
    }
}
