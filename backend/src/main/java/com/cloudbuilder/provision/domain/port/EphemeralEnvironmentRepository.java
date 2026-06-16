package com.cloudbuilder.provision.domain.port;

import com.cloudbuilder.provision.domain.model.EphemeralEnvironment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface EphemeralEnvironmentRepository extends JpaRepository<EphemeralEnvironment, UUID> {

    List<EphemeralEnvironment> findByTenantId(String tenantId);

    List<EphemeralEnvironment> findByProjectId(String projectId);

    List<EphemeralEnvironment> findByTenantIdAndStatus(String tenantId, String status);

    List<EphemeralEnvironment> findByStatusAndExpiresAtBefore(String status, Instant now);

    List<EphemeralEnvironment> findBySourceEnvironmentId(UUID sourceEnvironmentId);

    long countByTenantIdAndStatusIn(String tenantId, List<String> statuses);
}
