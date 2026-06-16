package com.cloudbuilder.aiops.domain.service;

import com.cloudbuilder.aiops.domain.model.Incident;
import com.cloudbuilder.aiops.domain.port.IncidentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final AIService aiService;

    public IncidentService(IncidentRepository incidentRepository, AIService aiService) {
        this.incidentRepository = incidentRepository;
        this.aiService = aiService;
    }

    public Incident createIncident(String environmentId, String title, String description, String severity) {
        var incident = new Incident(environmentId, title, description, severity);
        return incidentRepository.save(incident);
    }

    @Transactional(readOnly = true)
    public Incident getIncident(UUID id) {
        return incidentRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Incidente não encontrado: " + id));
    }

    @Transactional(readOnly = true)
    public List<Incident> getIncidents(String environmentId) {
        return incidentRepository.findByEnvironmentIdOrderByDetectedAtDesc(environmentId);
    }

    @Transactional(readOnly = true)
    public List<Incident> getIncidentsByStatus(String status) {
        return incidentRepository.findByStatus(status);
    }

    public Incident resolveIncident(UUID id) {
        var incident = getIncident(id);
        incident.setStatus("RESOLVED");
        incident.setResolvedAt(Instant.now());
        return incidentRepository.save(incident);
    }

    public Incident analyzeIncident(UUID id) {
        var incident = getIncident(id);
        var classification = aiService.classifyIncident(incident.getDescription());
        var rca = aiService.analyzeIncident(incident);
        incident.setClassification(classification);
        incident.setSuggestedRca(rca);
        return incidentRepository.save(incident);
    }

    @Transactional(readOnly = true)
    public String answerQuery(String question, String context) {
        return aiService.answerQuery(question, context);
    }
}
