package com.cloudbuilder.observe.domain.port;

import com.cloudbuilder.observe.domain.model.Alert;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AlertRepository extends JpaRepository<Alert, UUID> {
    List<Alert> findByEnvironmentId(String environmentId);
    List<Alert> findByStatus(String status);
    List<Alert> findBySeverityAndStatus(String severity, String status);
    List<Alert> findByEnvironmentIdOrderByTriggeredAtDesc(String environmentId);
}
