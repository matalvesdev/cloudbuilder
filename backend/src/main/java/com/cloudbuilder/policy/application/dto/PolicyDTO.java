package com.cloudbuilder.policy.application.dto;

import com.cloudbuilder.policy.domain.model.Policy;

public record PolicyDTO(
    String id,
    String tenantId,
    String name,
    String description,
    Policy.PolicyType type,
    Policy.PolicySeverity severity,
    boolean enabled,
    boolean enforced,
    String regoRule
) {
    public static PolicyDTO from(Policy p) {
        return new PolicyDTO(
            p.getId(), p.getTenantId(), p.getName(), p.getDescription(),
            p.getType(), p.getSeverity(), p.isEnabled(), p.isEnforced(),
            p.getRegoRule()
        );
    }
}
