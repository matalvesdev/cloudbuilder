package com.cloudbuilder.aiops.domain.service;

import com.cloudbuilder.aiops.domain.model.DiagnosisResult;
import com.cloudbuilder.aiops.domain.model.Incident;
import com.cloudbuilder.aiops.domain.port.DiagnosisResultRepository;
import com.cloudbuilder.aiops.domain.port.IncidentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class TroubleshootingService {

    private static final Logger log = LoggerFactory.getLogger(TroubleshootingService.class);

    private final DiagnosisResultRepository repository;
    private final AIService aiService;
    private final IncidentRepository incidentRepository;

    public TroubleshootingService(DiagnosisResultRepository repository,
                                  AIService aiService,
                                  IncidentRepository incidentRepository) {
        this.repository = repository;
        this.aiService = aiService;
        this.incidentRepository = incidentRepository;
    }

    public DiagnosisResult createDiagnosis(DiagnosisResult diagnosis) {
        // Enrich diagnosis with AI-generated root cause analysis
        enrichWithAiAnalysis(diagnosis);
        return repository.save(diagnosis);
    }

    /**
     * Calls {@link AIService#analyzeIncident(Incident)} to generate an AI-powered
     * root cause analysis for the incident linked to this diagnosis.
     * <p>
     * The AI-generated analysis is appended to or used as the diagnosis root cause
     * if one is not already set. If the AI call fails (e.g., LLM provider unavailable),
     * the diagnosis is saved without AI enrichment and the error is logged.
     */
    private void enrichWithAiAnalysis(DiagnosisResult diagnosis) {
        try {
            var incidentOpt = incidentRepository.findById(diagnosis.getIncidentId());
            if (incidentOpt.isEmpty()) {
                log.warn("Incident not found for diagnosis enrichment: incidentId={}",
                        diagnosis.getIncidentId());
                return;
            }

            var incident = incidentOpt.get();
            var aiAnalysis = aiService.analyzeIncident(incident);

            if (aiAnalysis != null && !aiAnalysis.isBlank()) {
                var existingRootCause = diagnosis.getRootCause();
                if (existingRootCause == null || existingRootCause.isBlank()) {
                    diagnosis.setRootCause(aiAnalysis);
                } else {
                    diagnosis.setRootCause(existingRootCause + "\n\n--- Análise IA ---\n" + aiAnalysis);
                }
                log.info("Diagnosis enriched with AI analysis: incidentId={}, diagnosisId={}",
                        incident.getId(), diagnosis.getId());
            }
        } catch (Exception e) {
            log.warn("Failed to enrich diagnosis with AI analysis: {}", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public Optional<DiagnosisResult> getDiagnosis(String id) {
        return repository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<DiagnosisResult> getDiagnosesByIncident(String incidentId) {
        return repository.findByIncidentId(incidentId);
    }

    public Optional<DiagnosisResult> updateDiagnosis(String id, String rootCause, String confidence,
                                                       String status, String recommendedAction) {
        return repository.findById(id).map(d -> {
            if (rootCause != null) d.setRootCause(rootCause);
            if (confidence != null) d.setConfidence(confidence);
            if (status != null) d.setStatus(status);
            if (recommendedAction != null) d.setRecommendedAction(recommendedAction);
            d.setUpdatedAt(Instant.now());
            return repository.save(d);
        });
    }

    @Transactional(readOnly = true)
    public List<DiagnosisResult> getDiagnosesByStatus(String status) {
        return repository.findByStatus(status);
    }

    public void deleteDiagnosis(String id) {
        repository.deleteById(id);
    }
}
