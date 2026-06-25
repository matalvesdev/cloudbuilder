package com.cloudbuilder.aiops.domain.service;

import com.cloudbuilder.aiops.domain.model.Incident;
import com.cloudbuilder.aiops.domain.port.IncidentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
@Service
@Transactional
public class AIOpsService {

    private final IncidentRepository incidentRepository;
    private final AIService aiService;

    public AIOpsService(IncidentRepository incidentRepository, AIService aiService) {
        this.incidentRepository = incidentRepository;
        this.aiService = aiService;
    }

    public Incident createIncident(Incident incident) {
        return incidentRepository.save(incident);
    }

    @Transactional(readOnly = true)
    public List<Incident> getIncidents(String environmentId) {
        return incidentRepository.findByEnvironmentIdOrderByDetectedAtDesc(environmentId);
    }

    @Transactional(readOnly = true)
    public Optional<Incident> getIncident(String id) {
        return incidentRepository.findById(id);
    }

    public Incident classifyIncident(String id, String classification) {
        var incident = incidentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Incident not found: " + id));
        incident.setClassification(classification);
        return incidentRepository.save(incident);
    }

    public Incident suggestRca(String id, String suggestedRca) {
        var incident = incidentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Incident not found: " + id));
        incident.setSuggestedRca(suggestedRca);
        return incidentRepository.save(incident);
    }

    public Incident resolveIncident(String id) {
        var incident = incidentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Incident not found: " + id));
        incident.setStatus("RESOLVED");
        incident.setResolvedAt(Instant.now());
        return incidentRepository.save(incident);
    }

    public Incident analyzeIncident(String id) {
        var incident = incidentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Incident not found: " + id));
        var classification = aiService.classifyIncident(incident.getDescription());
        var rca = aiService.analyzeIncident(incident);
        incident.setClassification(classification);
        incident.setSuggestedRca(rca);
        return incidentRepository.save(incident);
    }

    @Transactional(readOnly = true)
    public String answerQuery(String question, String context, Map<String, Object> extraContext) {
        var ctx = new HashMap<String, Object>();
        ctx.put("incidentCount", context);
        if (extraContext != null) {
            ctx.putAll(extraContext);
        }
        return aiService.answerQuery(question, ctx);
    }

    @Transactional(readOnly = true)
    public String answerQuery(String question, String context) {
        return answerQuery(question, context, Map.of());
    }

    @Transactional(readOnly = true)
    public String analyzeMetric(String metricName, List<Double> recentValues, double threshold) {
        return aiService.analyzeMetric(metricName, recentValues, threshold);
    }
}
