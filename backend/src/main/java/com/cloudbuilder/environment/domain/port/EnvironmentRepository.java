package com.cloudbuilder.environment.domain.port;

import com.cloudbuilder.environment.domain.model.ManagedEnvironment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EnvironmentRepository extends JpaRepository<ManagedEnvironment, String> {
    List<ManagedEnvironment> findByTenantId(String tenantId);
    List<ManagedEnvironment> findByTenantIdAndProvider(String tenantId, String provider);
}
