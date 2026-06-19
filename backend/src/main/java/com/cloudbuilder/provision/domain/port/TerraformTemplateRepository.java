package com.cloudbuilder.provision.domain.port;

import com.cloudbuilder.provision.domain.model.TerraformTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
public interface TerraformTemplateRepository extends JpaRepository<TerraformTemplate, String> {

    Optional<TerraformTemplate> findByResourceType(String resourceType);

    List<TerraformTemplate> findByProvider(String provider);

    List<TerraformTemplate> findByIsActiveTrue();
}
