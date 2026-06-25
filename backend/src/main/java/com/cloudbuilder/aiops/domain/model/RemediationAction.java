package com.cloudbuilder.aiops.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Represents a remediation action taken or suggested for an incident.
 * Supports manual execution and AI-suggested actions.
 */
@Entity
@Table(name = "aiops_remediation_actions")
public class RemediationAction {

    public enum ActionType {
        RESTART_SERVICE,
        SCALE_UP,
        SCALE_DOWN,
        ROLLBACK_DEPLOY,
        CLEAR_CACHE,
        INCREASE_TIMEOUT,
        RETRY_CONNECTION,
        EXECUTE_SCRIPT,
        DNS_UPDATE,
        OTHER
    }

    public enum Status {
        SUGGESTED,
        APPROVED,
        IN_PROGRESS,
        COMPLETED,
        FAILED,
        SKIPPED
    }

    @Id
    private String id;

    @Column(name = "incident_id", nullable = false)
    private String incidentId;

    @Column(name = "action_type", nullable = false)
    private String actionType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String script;

    @Column(nullable = false)
    private String status;

    @Column(name = "is_ai_suggested")
    private boolean aiSuggested;

    @Column(name = "executed_by")
    private String executedBy;

    @Column(name = "executed_at")
    private Instant executedAt;

    @Column(columnDefinition = "TEXT")
    private String result;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected RemediationAction() {}

    public RemediationAction(String incidentId, String actionType, String description) {
        this.id = UUID.randomUUID().toString();
        this.incidentId = incidentId;
        this.actionType = actionType;
        this.description = description;
        this.status = Status.SUGGESTED.name();
        this.aiSuggested = false;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public RemediationAction(String incidentId, String actionType, String description, boolean aiSuggested) {
        this.id = UUID.randomUUID().toString();
        this.incidentId = incidentId;
        this.actionType = actionType;
        this.description = description;
        this.status = Status.SUGGESTED.name();
        this.aiSuggested = aiSuggested;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public String getIncidentId() { return incidentId; }
    public String getActionType() { return actionType; }
    public void setActionType(String actionType) { this.actionType = actionType; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getScript() { return script; }
    public void setScript(String script) { this.script = script; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public boolean isAiSuggested() { return aiSuggested; }
    public void setAiSuggested(boolean aiSuggested) { this.aiSuggested = aiSuggested; }
    public String getExecutedBy() { return executedBy; }
    public void setExecutedBy(String executedBy) { this.executedBy = executedBy; }
    public Instant getExecutedAt() { return executedAt; }
    public void setExecutedAt(Instant executedAt) { this.executedAt = executedAt; }
    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void markCompleted(String result) {
        this.status = Status.COMPLETED.name();
        this.result = result;
        this.executedAt = Instant.now();
    }

    public void markFailed(String errorMessage) {
        this.status = Status.FAILED.name();
        this.errorMessage = errorMessage;
        this.executedAt = Instant.now();
    }
}
