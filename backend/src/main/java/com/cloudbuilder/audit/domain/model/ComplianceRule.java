package com.cloudbuilder.audit.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "compliance_rules")
public class ComplianceRule {

    @Id
    private String id;

    @Column(nullable = false)
    private String tenantId;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String category; // SECURITY, COST, OPERATIONS, GOVERNANCE

    @Column(nullable = false)
    private String severity; // CRITICAL, HIGH, MEDIUM, LOW

    @Column(nullable = false)
    private String ruleType; // AUDIT_PATTERN, COST_THRESHOLD, RESOURCE_CONSTRAINT

    @Column(columnDefinition = "TEXT")
    private String configJson;

    @Column(nullable = false)
    private boolean enabled;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected ComplianceRule() {}

    public ComplianceRule(String tenantId, String name, String description,
                          String category, String severity, String ruleType,
                          String configJson, boolean enabled) {
        this.id = UUID.randomUUID().toString();
        this.tenantId = tenantId;
        this.name = name;
        this.description = description;
        this.category = category;
        this.severity = severity;
        this.ruleType = ruleType;
        this.configJson = configJson;
        this.enabled = enabled;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public void update(String name, String description, String category,
                       String severity, String ruleType, String configJson,
                       boolean enabled) {
        this.name = name;
        this.description = description;
        this.category = category;
        this.severity = severity;
        this.ruleType = ruleType;
        this.configJson = configJson;
        this.enabled = enabled;
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public String getTenantId() { return tenantId; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getCategory() { return category; }
    public String getSeverity() { return severity; }
    public String getRuleType() { return ruleType; }
    public String getConfigJson() { return configJson; }
    public boolean isEnabled() { return enabled; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
