package com.cloudbuilder.provision.domain.port;

import com.cloudbuilder.provision.domain.model.TerraformTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TerraformTemplateRepository extends JpaRepository<TerraformTemplate, UUID> {

    Optional<TerraformTemplate> findByResourceType(String resourceType);

    List<TerraformTemplate> findByProvider(String provider);

    List<TerraformTemplate> findByIsActiveTrue();
}
