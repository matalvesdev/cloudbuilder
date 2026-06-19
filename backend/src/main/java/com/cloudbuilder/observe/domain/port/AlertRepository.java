package com.cloudbuilder.observe.domain.port;

import com.cloudbuilder.observe.domain.model.Alert;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
public interface AlertRepository extends JpaRepository<Alert, String> {
    List<Alert> findByEnvironmentId(String environmentId);
    List<Alert> findByStatus(String status);
    List<Alert> findBySeverityAndStatus(String severity, String status);
    List<Alert> findByEnvironmentIdOrderByTriggeredAtDesc(String environmentId);
}
