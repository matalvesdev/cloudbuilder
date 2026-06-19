package com.cloudbuilder.provision.domain.port;

import com.cloudbuilder.provision.domain.model.Environment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
public interface EnvironmentRepository extends JpaRepository<Environment, String> {

    List<Environment> findByTenantId(String tenantId);

    List<Environment> findByCanvasId(String canvasId);
}
