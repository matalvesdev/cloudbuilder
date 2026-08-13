package com.cloudbuilder.notification.domain.port;

import com.cloudbuilder.notification.domain.model.NotificationTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NotificationTemplateRepository extends JpaRepository<NotificationTemplate, String> {

    Optional<NotificationTemplate> findByTenantIdAndCode(String tenantId, String code);

    Optional<NotificationTemplate> findByCode(String code);
}
