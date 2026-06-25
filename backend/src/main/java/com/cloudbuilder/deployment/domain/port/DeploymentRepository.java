package com.cloudbuilder.deployment.domain.port;

import com.cloudbuilder.deployment.domain.model.Deployment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeploymentRepository extends JpaRepository<Deployment, String> {
    List<Deployment> findByEnvironmentIdOrderByStartedAtDesc(String environmentId);
    List<Deployment> findByTenantIdOrderByCreatedAtDesc(String tenantId);
}
