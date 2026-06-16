package com.cloudbuilder.observe.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "alerts")
public class Alert {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String environmentId;

    @Column(nullable = false)
    private String severity;

    @Column(nullable = false)
    private String message;

    private String source;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false, updatable = false)
    private Instant triggeredAt;

    private Instant resolvedAt;

    protected Alert() {}

    public Alert(String environmentId, String severity, String message, String source) {
        this.id = UUID.randomUUID();
        this.environmentId = environmentId;
        this.severity = severity;
        this.message = message;
        this.source = source;
        this.status = "OPEN";
        this.triggeredAt = Instant.now();
    }

    public UUID getId() { return id; }
    public String getEnvironmentId() { return environmentId; }
    public String getSeverity() { return severity; }
    public String getMessage() { return message; }
    public String getSource() { return source; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getTriggeredAt() { return triggeredAt; }
    public Instant getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Instant resolvedAt) { this.resolvedAt = resolvedAt; }
}
