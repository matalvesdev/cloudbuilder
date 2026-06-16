package com.cloudbuilder.observe.domain.port;

import com.cloudbuilder.observe.domain.model.ServiceHealth;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ServiceHealthRepository extends JpaRepository<ServiceHealth, UUID> {
    List<ServiceHealth> findByEnvironmentId(String environmentId);
    Optional<ServiceHealth> findTopByServiceNameAndEnvironmentIdOrderByCheckedAtDesc(
            String serviceName, String environmentId);
    List<ServiceHealth> findByStatusAndEnvironmentId(String status, String environmentId);
}
