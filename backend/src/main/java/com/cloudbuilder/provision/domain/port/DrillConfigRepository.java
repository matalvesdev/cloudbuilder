package com.cloudbuilder.provision.domain.port;

import com.cloudbuilder.provision.domain.model.DrillConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
public interface DrillConfigRepository extends JpaRepository<DrillConfig, String> {
    List<DrillConfig> findByFailoverGroupId(String failoverGroupId);
    List<DrillConfig> findByStatus(String status);
}
