package com.cloudbuilder.approval.domain.port;

import com.cloudbuilder.approval.domain.model.ApprovalRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApprovalRuleRepository extends JpaRepository<ApprovalRule, String> {
    List<ApprovalRule> findByTenantId(String tenantId);
    Optional<ApprovalRule> findByEnvironmentId(String environmentId);
}
