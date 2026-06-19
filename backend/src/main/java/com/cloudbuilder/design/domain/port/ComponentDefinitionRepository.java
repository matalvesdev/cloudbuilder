package com.cloudbuilder.design.domain.port;

import com.cloudbuilder.design.domain.model.ComponentDefinition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
public interface ComponentDefinitionRepository extends JpaRepository<ComponentDefinition, String> {

    List<ComponentDefinition> findByProvider(String provider);

    Optional<ComponentDefinition> findByResourceType(String resourceType);

    List<ComponentDefinition> findByCategory(String category);

    List<ComponentDefinition> findByIsActiveTrue();
}
