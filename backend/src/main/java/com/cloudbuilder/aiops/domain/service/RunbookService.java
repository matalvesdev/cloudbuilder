package com.cloudbuilder.aiops.domain.service;

import com.cloudbuilder.aiops.domain.model.Runbook;
import com.cloudbuilder.aiops.domain.model.Incident;
import com.cloudbuilder.aiops.domain.port.RunbookRepository;
import com.cloudbuilder.aiops.domain.port.IncidentRepository;
import com.cloudbuilder.aiops.domain.service.llm.LlmClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service for managing runbooks — standard operating procedures for incident response.
 * Supports search, AI-suggested runbooks, and applying runbook steps.
 */
@Service
@Transactional
public class RunbookService {

    private static final Logger log = LoggerFactory.getLogger(RunbookService.class);

    private final RunbookRepository runbookRepository;
    private final IncidentRepository incidentRepository;
    private final LlmClient llmClient;

    public RunbookService(RunbookRepository runbookRepository,
                          IncidentRepository incidentRepository,
                          LlmClient llmClient) {
        this.runbookRepository = runbookRepository;
        this.incidentRepository = incidentRepository;
        this.llmClient = llmClient;
    }

    public Runbook createRunbook(Runbook runbook) {
        return runbookRepository.save(runbook);
    }

    @Transactional(readOnly = true)
    public Optional<Runbook> getRunbook(String id) {
        return runbookRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<Runbook> getAllRunbooks() {
        return runbookRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Runbook> searchRunbooks(String query) {
        if (query == null || query.isBlank()) {
            return runbookRepository.findAll();
        }
        return runbookRepository.search(query);
    }

    @Transactional(readOnly = true)
    public List<Runbook> getRunbooksByCategory(String category) {
        return runbookRepository.findByCategory(category);
    }

    /**
     * Use AI to suggest relevant runbooks for a given incident.
     */
    @Transactional(readOnly = true)
    public List<Runbook> suggestRunbooks(String incidentId) {
        var incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new IllegalArgumentException("Incident not found: " + incidentId));

        // Use LLM to determine which runbook categories are relevant
        String suggestion = llmClient.chat(
            "You are a Site Reliability Engineer. Based on the incident description, "
                    + "suggest which runbook categories would be most relevant (DATABASE, NETWORK, "
                    + "SECURITY, APPLICATION, INFRASTRUCTURE, DEPLOYMENT, GENERAL). "
                    + "Return only the category name.",
            "Incident: " + incident.getTitle() + "\nDescription: " + incident.getDescription(),
            Map.of("incidentId", incidentId, "type", "runbook-suggestion")
        );

        // Try to match the suggested category, fallback to GENERAL
        String category = suggestion.trim().toUpperCase();
        if (!List.of("DATABASE", "NETWORK", "SECURITY", "APPLICATION", "INFRASTRUCTURE", "DEPLOYMENT", "GENERAL")
                .contains(category)) {
            category = "GENERAL";
        }

        return runbookRepository.findByCategory(category);
    }

    public Runbook updateRunbook(String id, String title, String content, String category,
                                  String tags, String severity, Integer estimatedDurationMinutes,
                                  Boolean automated) {
        var runbook = runbookRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Runbook not found: " + id));
        if (title != null) runbook.setTitle(title);
        if (content != null) runbook.setContent(content);
        if (category != null) runbook.setCategory(category);
        if (tags != null) runbook.setTags(tags);
        if (severity != null) runbook.setSeverity(severity);
        if (estimatedDurationMinutes != null) runbook.setEstimatedDurationMinutes(estimatedDurationMinutes);
        if (automated != null) runbook.setAutomated(automated);
        return runbookRepository.save(runbook);
    }

    public void deleteRunbook(String id) {
        if (!runbookRepository.existsById(id)) {
            throw new IllegalArgumentException("Runbook not found: " + id);
        }
        runbookRepository.deleteById(id);
    }
}
