package com.cloudbuilder.notification.domain.service;

import com.cloudbuilder.notification.domain.model.Notification;
import com.cloudbuilder.notification.domain.port.NotificationRepository;
import com.cloudbuilder.notification.domain.port.NotificationTemplateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationDispatchServiceTest {

    @Mock
    private NotificationRepository notificationRepo;
    @Mock
    private NotificationTemplateRepository templateRepo;

    private NotificationDispatchService service;

    @BeforeEach
    void setUp() {
        service = new NotificationDispatchService(notificationRepo, templateRepo);
    }

    @Test
    void createNotification_savesWithCorrectFields() {
        when(notificationRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Notification result = service.createNotification("tenant-1", "user-1",
            Notification.NotificationType.DEPLOYMENT_COMPLETED, Notification.NotificationChannel.IN_APP,
            "Deployment Complete", "Your infrastructure was deployed successfully");

        assertNotNull(result);
        assertEquals("tenant-1", result.getTenantId());
        assertEquals("user-1", result.getUserId());
        assertEquals(Notification.NotificationType.DEPLOYMENT_COMPLETED, result.getType());
        assertEquals("Deployment Complete", result.getTitle());
        verify(notificationRepo).save(any(Notification.class));
    }

    @Test
    void markAsRead_updatesNotificationStatus() {
        var notification = new Notification("tenant-1", "user-1",
            Notification.NotificationType.DEPLOYMENT_COMPLETED, Notification.NotificationChannel.IN_APP,
            "Test", "Body");
        when(notificationRepo.findById("notif-1")).thenReturn(java.util.Optional.of(notification));
        when(notificationRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.markAsRead("notif-1");

        verify(notificationRepo).save(notification);
    }

    @Test
    void markAsSent_updatesNotificationStatus() {
        var notification = new Notification("tenant-1", "user-1",
            Notification.NotificationType.DEPLOYMENT_COMPLETED, Notification.NotificationChannel.IN_APP,
            "Test", "Body");
        when(notificationRepo.findById("notif-1")).thenReturn(java.util.Optional.of(notification));
        when(notificationRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.markAsSent("notif-1");

        verify(notificationRepo).save(notification);
    }

    @Test
    void markAsFailed_recordsError() {
        var notification = new Notification("tenant-1", "user-1",
            Notification.NotificationType.DEPLOYMENT_FAILED, Notification.NotificationChannel.IN_APP,
            "Test", "Body");
        when(notificationRepo.findById("notif-1")).thenReturn(java.util.Optional.of(notification));
        when(notificationRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.markAsFailed("notif-1", "SMTP timeout");

        verify(notificationRepo).save(notification);
    }

    @Test
    void getUnreadCount_returnsCount() {
        when(notificationRepo.countByTenantIdAndUserIdAndStatusNot(
            "tenant-1", "user-1", Notification.NotificationStatus.READ)).thenReturn(5L);

        long count = service.getUnreadCount("tenant-1", "user-1");

        assertEquals(5L, count);
    }
}
