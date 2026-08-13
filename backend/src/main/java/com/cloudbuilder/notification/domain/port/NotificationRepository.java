package com.cloudbuilder.notification.domain.port;

import com.cloudbuilder.notification.domain.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {

    Page<Notification> findByTenantIdAndUserIdOrderByCreatedAtDesc(
        String tenantId, String userId, Pageable pageable);

    Page<Notification> findByTenantIdAndStatusOrderByCreatedAtDesc(
        String tenantId, Notification.NotificationStatus status, Pageable pageable);

    long countByTenantIdAndUserIdAndStatusNot(String tenantId, String userId,
                                               Notification.NotificationStatus status);

    @Query("SELECT n FROM Notification n WHERE n.tenantId = :tenantId AND n.status = 'PENDING'")
    List<Notification> findPendingNotifications(@Param("tenantId") String tenantId);

    List<Notification> findByTemplateId(String templateId);
}
