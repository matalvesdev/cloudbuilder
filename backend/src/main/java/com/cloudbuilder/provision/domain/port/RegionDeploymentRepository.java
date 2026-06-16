package com.cloudbuilder.provision.domain.port;

import com.cloudbuilder.provision.domain.model.RegionDeployment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RegionDeploymentRepository extends JpaRepository<RegionDeployment, UUID> {
    List<RegionDeployment> findByEnvironmentId(UUID environmentId);
    List<RegionDeployment> findByEnvironmentIdAndStatus(UUID environmentId, String status);
    List<RegionDeployment> findByEnvironmentIdAndPrimary(UUID environmentId, boolean primary);
}
