package com.cloudbuilder.policy.domain.port;

import com.cloudbuilder.policy.domain.model.Policy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PolicyRepository extends JpaRepository<Policy, String> {

    Page<Policy> findByTenantIdOrderByCreatedAtDesc(String tenantId, Pageable pageable);

    List<Policy> findByTenantIdAndEnabledTrue(String tenantId);

    List<Policy> findByTenantIdAndTypeAndEnabledTrue(String tenantId, Policy.PolicyType type);
}
