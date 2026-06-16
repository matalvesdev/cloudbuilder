package com.cloudbuilder.aiops.domain.port;

import com.cloudbuilder.aiops.domain.model.Incident;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface IncidentRepository extends JpaRepository<Incident, UUID> {
    List<Incident> findByEnvironmentId(String environmentId);
    List<Incident> findByStatus(String status);
    List<Incident> findBySeverity(String severity);
    List<Incident> findByEnvironmentIdOrderByDetectedAtDesc(String environmentId);
}
