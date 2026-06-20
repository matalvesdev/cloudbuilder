package com.cloudbuilder.audit.domain.port;

import com.cloudbuilder.audit.domain.model.ComplianceRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ComplianceRuleRepository extends JpaRepository<ComplianceRule, String> {

    List<ComplianceRule> findByTenantId(String tenantId);

    List<ComplianceRule> findByTenantIdAndCategory(String tenantId, String category);

    List<ComplianceRule> findByTenantIdAndEnabledTrue(String tenantId);
}
