package com.cloudbuilder.provision.domain.port;

import com.cloudbuilder.provision.domain.model.Environment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository("provisionEnvironmentRepository")
public interface EnvironmentRepository extends JpaRepository<Environment, String> {

    List<Environment> findByTenantId(String tenantId);

    List<Environment> findByCanvasId(String canvasId);

    List<Environment> findByProjectId(String projectId);
}
