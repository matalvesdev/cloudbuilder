package com.cloudbuilder.provision.domain.port;

import com.cloudbuilder.provision.domain.model.Environment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EnvironmentRepository extends JpaRepository<Environment, UUID> {

    List<Environment> findByTenantId(String tenantId);

    List<Environment> findByCanvasId(UUID canvasId);
}
