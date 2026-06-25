package com.cloudbuilder.aiops.domain.service;

import com.cloudbuilder.aiops.domain.model.RemediationAction;
import com.cloudbuilder.aiops.domain.model.Incident;
import com.cloudbuilder.aiops.domain.port.RemediationRepository;
import com.cloudbuilder.aiops.domain.port.IncidentRepository;
import com.cloudbuilder.aiops.domain.service.llm.LlmClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service for managing remediation actions.
 * Supports manual execution and AI-suggested remediation steps.
 */
@Service
@Transactional
public class RemediationService {

    private static final Logger log = LoggerFactory.getLogger(RemediationService.class);

    private final RemediationRepository remediationRepository;
    private final IncidentRepository incidentRepository;
    private final LlmClient llmClient;

    public RemediationService(RemediationRepository remediationRepository,
                              IncidentRepository incidentRepository,
                              LlmClient llmClient) {
        this.remediationRepository = remediationRepository;
        this.incidentRepository = incidentRepository;
        this.llmClient = llmClient;
    }

    /**
     * Create a new remediation action for an incident.
     */
    public RemediationAction createAction(String incidentId, String actionType, String description) {
        var action = new RemediationAction(incidentId, actionType, description);
        return remediationRepository.save(action);
    }

    /**
     * Execute a remediation action and record the result.
     */
    public RemediationAction executeAction(String actionId, String executedBy) {
        var action = remediationRepository.findById(actionId)
                .orElseThrow(() -> new IllegalArgumentException("Remediation action not found: " + actionId));

        if (!RemediationAction.Status.SUGGESTED.name().equals(action.getStatus())
                && !RemediationAction.Status.APPROVED.name().equals(action.getStatus())) {
            throw new IllegalStateException("Action is not in a executable state. Current status: " + action.getStatus());
        }

        action.setStatus(RemediationAction.Status.IN_PROGRESS.name());
        action.setExecutedBy(executedBy);
        remediationRepository.save(action);

        try {
            // In a real implementation, this would execute the actual remediation
            // e.g., restart service, scale resources, run script
            String result = simulateExecute(action);
            action.markCompleted(result);
            log.info("Remediation action {} executed successfully by {}", actionId, executedBy);
        } catch (Exception e) {
            action.markFailed(e.getMessage());
            log.error("Remediation action {} failed: {}", actionId, e.getMessage());
        }

        return remediationRepository.save(action);
    }

    /**
     * Suggest remediation actions using AI based on incident context.
     */
    public List<RemediationAction> suggestActions(String incidentId) {
        var incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new IllegalArgumentException("Incident not found: " + incidentId));

        // Use LLM to generate remediation suggestions
        String suggestion = llmClient.chat(
            "You are a Site Reliability Engineer. Suggest remediation actions for the given incident.",
            "Incident: " + incident.getTitle() + "\nDescription: " + incident.getDescription()
                    + "\nSeverity: " + incident.getSeverity(),
            Map.of("incidentId", incidentId, "type", "remediation")
        );

        // Create a remediation action from the AI suggestion
        var action = new RemediationAction(
                incidentId,
                RemediationAction.ActionType.OTHER.name(),
                suggestion,
                true
        );
        remediationRepository.save(action);

        return remediationRepository.findByIncidentId(incidentId);
    }

    @Transactional(readOnly = true)
    public Optional<RemediationAction> getAction(String id) {
        return remediationRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<RemediationAction> getActionsByIncident(String incidentId) {
        return remediationRepository.findByIncidentId(incidentId);
    }

    @Transactional(readOnly = true)
    public List<RemediationAction> getSuggestedActions() {
        return remediationRepository.findByStatus(RemediationAction.Status.SUGGESTED.name());
    }

    public RemediationAction approveAction(String actionId) {
        var action = remediationRepository.findById(actionId)
                .orElseThrow(() -> new IllegalArgumentException("Remediation action not found: " + actionId));
        action.setStatus(RemediationAction.Status.APPROVED.name());
        return remediationRepository.save(action);
    }

    public RemediationAction skipAction(String actionId) {
        var action = remediationRepository.findById(actionId)
                .orElseThrow(() -> new IllegalArgumentException("Remediation action not found: " + actionId));
        action.setStatus(RemediationAction.Status.SKIPPED.name());
        return remediationRepository.save(action);
    }

    /**
     * Simulate execution of a remediation action.
     * In production, this would trigger actual infrastructure operations.
     */
    private String simulateExecute(RemediationAction action) {
        return "Ação executada: " + action.getDescription()
                + " — Tipo: " + action.getActionType()
                + " — Status: concluído com sucesso em "
                + java.time.LocalDateTime.now().toString();
    }
}
