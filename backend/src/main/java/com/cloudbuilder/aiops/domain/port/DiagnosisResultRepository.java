package com.cloudbuilder.aiops.domain.port;

import com.cloudbuilder.aiops.domain.model.DiagnosisResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DiagnosisResultRepository extends JpaRepository<DiagnosisResult, String> {
    List<DiagnosisResult> findByIncidentId(String incidentId);
    List<DiagnosisResult> findByStatus(String status);
}
