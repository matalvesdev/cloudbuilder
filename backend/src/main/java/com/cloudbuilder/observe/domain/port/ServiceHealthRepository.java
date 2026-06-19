package com.cloudbuilder.observe.domain.port;

import com.cloudbuilder.observe.domain.model.ServiceHealth;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
public interface ServiceHealthRepository extends JpaRepository<ServiceHealth, String> {
    List<ServiceHealth> findByEnvironmentId(String environmentId);
    Optional<ServiceHealth> findTopByServiceNameAndEnvironmentIdOrderByCheckedAtDesc(
            String serviceName, String environmentId);
    List<ServiceHealth> findByStatusAndEnvironmentId(String status, String environmentId);
}
