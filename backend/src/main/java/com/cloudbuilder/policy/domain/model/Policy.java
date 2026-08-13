package com.cloudbuilder.policy.domain.model;

import com.cloudbuilder.shared.kernel.AggregateRoot;
import jakarta.persistence.*;

@Entity
@Table(name = "policies")
public class Policy extends AggregateRoot {

    @Column(nullable = false)
    private String tenantId;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PolicyType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PolicySeverity severity;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String regoRule;

    @Column(nullable = false)
    private boolean enabled;

    @Column(nullable = false)
    private boolean enforced;

    @Column(columnDefinition = "TEXT")
    private String configJson;

    protected Policy() {}

    public Policy(String tenantId, String name, String description,
                  PolicyType type, PolicySeverity severity, String regoRule) {
        this.tenantId = tenantId;
        this.name = name;
        this.description = description;
        this.type = type;
        this.severity = severity;
        this.regoRule = regoRule;
        this.enabled = true;
        this.enforced = false;
    }

    public void enable() { this.enabled = true; }
    public void disable() { this.enabled = false; }
    public void enforce() { this.enforced = true; }

    public String getTenantId() { return tenantId; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public PolicyType getType() { return type; }
    public PolicySeverity getSeverity() { return severity; }
    public String getRegoRule() { return regoRule; }
    public boolean isEnabled() { return enabled; }
    public boolean isEnforced() { return enforced; }

    public enum PolicyType {
        COST, SECURITY, GOVERNANCE, COMPLIANCE, CUSTOM
    }

    public enum PolicySeverity {
        CRITICAL, HIGH, MEDIUM, LOW, INFO
    }
}
