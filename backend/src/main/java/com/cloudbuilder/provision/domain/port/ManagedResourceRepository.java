package com.cloudbuilder.provision.domain.port;

import com.cloudbuilder.provision.domain.model.ManagedResource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
public interface ManagedResourceRepository extends JpaRepository<ManagedResource, String> {

    List<ManagedResource> findByEnvironmentId(String environmentId);

    List<ManagedResource> findByEnvironmentIdAndStatus(String environmentId, String status);

    Optional<ManagedResource> findByTerraformAddress(String address);
}
