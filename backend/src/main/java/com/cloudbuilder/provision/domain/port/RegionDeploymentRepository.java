package com.cloudbuilder.provision.domain.port;

import com.cloudbuilder.provision.domain.model.RegionDeployment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
public interface RegionDeploymentRepository extends JpaRepository<RegionDeployment, String> {
    List<RegionDeployment> findByEnvironmentId(String environmentId);
    List<RegionDeployment> findByEnvironmentIdAndStatus(String environmentId, String status);
    List<RegionDeployment> findByEnvironmentIdAndPrimary(String environmentId, boolean primary);
}
