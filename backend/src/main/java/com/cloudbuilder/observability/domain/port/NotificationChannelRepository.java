package com.cloudbuilder.observability.domain.port;

import com.cloudbuilder.observability.domain.model.NotificationChannelEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface NotificationChannelRepository extends JpaRepository<NotificationChannelEntity, String> {

    List<NotificationChannelEntity> findByTenantIdAndEnabledTrue(String tenantId);
}
