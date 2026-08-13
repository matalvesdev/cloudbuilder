package com.cloudbuilder.observe.domain.port;

import com.cloudbuilder.observe.domain.model.SloDefinition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SloDefinitionRepository extends JpaRepository<SloDefinition, String> {
    List<SloDefinition> findByEnvironmentId(String environmentId);
    List<SloDefinition> findByServiceNameAndEnvironmentId(String serviceName, String environmentId);
    List<SloDefinition> findByStatus(String status);
}
