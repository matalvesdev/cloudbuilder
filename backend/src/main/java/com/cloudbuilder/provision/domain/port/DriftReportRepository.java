package com.cloudbuilder.provision.domain.port;

import com.cloudbuilder.provision.domain.model.DriftReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
public interface DriftReportRepository extends JpaRepository<DriftReport, String> {

    List<DriftReport> findByEnvironmentIdOrderByDetectedAtDesc(String environmentId);

    List<DriftReport> findByEnvironmentIdAndStatus(String environmentId, String status);

    Optional<DriftReport> findTopByEnvironmentIdOrderByDetectedAtDesc(String environmentId);
}
