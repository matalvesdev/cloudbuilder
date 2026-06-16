package com.cloudbuilder.provision.domain.port;

import com.cloudbuilder.provision.domain.model.DrillConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DrillConfigRepository extends JpaRepository<DrillConfig, UUID> {
    List<DrillConfig> findByFailoverGroupId(UUID failoverGroupId);
    List<DrillConfig> findByStatus(String status);
}
