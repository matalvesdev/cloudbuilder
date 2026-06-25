package com.cloudbuilder.git.domain.model;

import java.time.Instant;
import java.util.UUID;

public class WebhookEvent {

    public enum EventType {
        PUSH,
        PULL_REQUEST,
        MERGE,
        TAG,
        RELEASE,
        UNKNOWN
    }

    public enum Status {
        RECEIVED,
        VERIFIED,
        VERIFICATION_FAILED,
        PROCESSED,
        FAILED
    }

    private String id;
    private EventType eventType;
    private String repositoryId;
    private String payload;
    private String signature;
    private String deliveryId;
    private String branch;
    private String commitSha;
    private String actor;
    private Status status;
    private String failureReason;
    private Instant receivedAt;
    private Instant processedAt;

    public WebhookEvent() {}

    public WebhookEvent(EventType eventType, String repositoryId, String payload,
                        String signature, String deliveryId, String branch,
                        String commitSha, String actor) {
        this.id = UUID.randomUUID().toString();
        this.eventType = eventType;
        this.repositoryId = repositoryId;
        this.payload = payload;
        this.signature = signature;
        this.deliveryId = deliveryId;
        this.branch = branch;
        this.commitSha = commitSha;
        this.actor = actor;
        this.status = Status.RECEIVED;
        this.receivedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public EventType getEventType() { return eventType; }
    public void setEventType(EventType eventType) { this.eventType = eventType; }

    public String getRepositoryId() { return repositoryId; }
    public void setRepositoryId(String repositoryId) { this.repositoryId = repositoryId; }

    public String getPayload() { return payload; }
    public void setPayload(String payload) { this.payload = payload; }

    public String getSignature() { return signature; }
    public void setSignature(String signature) { this.signature = signature; }

    public String getDeliveryId() { return deliveryId; }
    public void setDeliveryId(String deliveryId) { this.deliveryId = deliveryId; }

    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }

    public String getCommitSha() { return commitSha; }
    public void setCommitSha(String commitSha) { this.commitSha = commitSha; }

    public String getActor() { return actor; }
    public void setActor(String actor) { this.actor = actor; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }

    public Instant getReceivedAt() { return receivedAt; }
    public void setReceivedAt(Instant receivedAt) { this.receivedAt = receivedAt; }

    public Instant getProcessedAt() { return processedAt; }
    public void setProcessedAt(Instant processedAt) { this.processedAt = processedAt; }
}
