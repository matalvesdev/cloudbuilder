package com.cloudbuilder.policy.domain.service;

import com.cloudbuilder.policy.domain.model.Policy;
import com.cloudbuilder.policy.domain.port.PolicyRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PolicyService {

    private final PolicyRepository policyRepo;

    public PolicyService(PolicyRepository policyRepo) {
        this.policyRepo = policyRepo;
    }

    @Transactional
    public Policy createPolicy(String tenantId, String name, String description,
                               Policy.PolicyType type, Policy.PolicySeverity severity,
                               String regoRule) {
        Policy policy = new Policy(tenantId, name, description, type, severity, regoRule);
        return policyRepo.save(policy);
    }

    public Page<Policy> listPolicies(String tenantId, Pageable pageable) {
        return policyRepo.findByTenantIdOrderByCreatedAtDesc(tenantId, pageable);
    }

    public List<Policy> getActivePolicies(String tenantId) {
        return policyRepo.findByTenantIdAndEnabledTrue(tenantId);
    }

    @Transactional
    public Policy enablePolicy(String id) {
        Policy policy = policyRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Policy not found"));
        policy.enable();
        return policyRepo.save(policy);
    }

    @Transactional
    public Policy disablePolicy(String id) {
        Policy policy = policyRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Policy not found"));
        policy.disable();
        return policyRepo.save(policy);
    }

    @Transactional
    public Policy enforcePolicy(String id) {
        Policy policy = policyRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Policy not found"));
        policy.enforce();
        return policyRepo.save(policy);
    }
}
