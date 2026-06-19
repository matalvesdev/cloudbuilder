package com.cloudbuilder.provision.domain.port;

import com.cloudbuilder.provision.domain.model.EphemeralEnvironment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
@Repository
public interface EphemeralEnvironmentRepository extends JpaRepository<EphemeralEnvironment, String> {

    List<EphemeralEnvironment> findByTenantId(String tenantId);

    List<EphemeralEnvironment> findByProjectId(String projectId);

    List<EphemeralEnvironment> findByTenantIdAndStatus(String tenantId, String status);

    List<EphemeralEnvironment> findByStatusAndExpiresAtBefore(String status, Instant now);

    List<EphemeralEnvironment> findBySourceEnvironmentId(String sourceEnvironmentId);

    long countByTenantIdAndStatusIn(String tenantId, List<String> statuses);
}
