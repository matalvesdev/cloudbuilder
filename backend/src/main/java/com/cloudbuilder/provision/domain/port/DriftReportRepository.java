package com.cloudbuilder.provision.domain.port;

import com.cloudbuilder.provision.domain.model.DriftReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DriftReportRepository extends JpaRepository<DriftReport, UUID> {

    List<DriftReport> findByEnvironmentIdOrderByDetectedAtDesc(UUID environmentId);

    List<DriftReport> findByEnvironmentIdAndStatus(UUID environmentId, String status);

    Optional<DriftReport> findTopByEnvironmentIdOrderByDetectedAtDesc(UUID environmentId);
}
