package com.cloudbuilder.provision.domain.port;

import com.cloudbuilder.provision.domain.model.ManagedResource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ManagedResourceRepository extends JpaRepository<ManagedResource, UUID> {

    List<ManagedResource> findByEnvironmentId(UUID environmentId);

    List<ManagedResource> findByEnvironmentIdAndStatus(UUID environmentId, String status);

    Optional<ManagedResource> findByTerraformAddress(String address);
}
