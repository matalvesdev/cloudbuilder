package com.cloudbuilder.policy.domain.service;

import com.cloudbuilder.policy.domain.model.Policy;
import com.cloudbuilder.policy.domain.port.PolicyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PolicyServiceTest {

    @Mock
    private PolicyRepository policyRepo;

    private PolicyService service;

    private Policy testPolicy;

    @BeforeEach
    void setUp() {
        service = new PolicyService(policyRepo);
        testPolicy = new Policy("tenant-1", "No Public S3", "S3 buckets must not be public",
            Policy.PolicyType.SECURITY, Policy.PolicySeverity.HIGH, "deny");
    }

    @Test
    void createPolicy_savesAndReturnsPolicy() {
        when(policyRepo.save(any())).thenReturn(testPolicy);

        Policy result = service.createPolicy("tenant-1", "No Public S3",
            "S3 buckets must not be public", Policy.PolicyType.SECURITY,
            Policy.PolicySeverity.HIGH, "deny");

        assertNotNull(result);
        assertEquals("No Public S3", result.getName());
        verify(policyRepo).save(any());
    }

    @Test
    void listPolicies_returnsPageOfPolicies() {
        Page<Policy> page = new PageImpl<>(List.of(testPolicy));
        when(policyRepo.findByTenantIdOrderByCreatedAtDesc(eq("tenant-1"), any()))
            .thenReturn(page);

        Page<Policy> result = service.listPolicies("tenant-1", PageRequest.of(0, 10));

        assertEquals(1, result.getContent().size());
        assertEquals("No Public S3", result.getContent().get(0).getName());
    }

    @Test
    void getActivePolicies_returnsEnabledPolicies() {
        when(policyRepo.findByTenantIdAndEnabledTrue("tenant-1")).thenReturn(List.of(testPolicy));

        List<Policy> result = service.getActivePolicies("tenant-1");

        assertEquals(1, result.size());
    }

    @Test
    void enablePolicy_enablesAndReturns() {
        when(policyRepo.findById("policy-1")).thenReturn(Optional.of(testPolicy));
        when(policyRepo.save(any())).thenReturn(testPolicy);

        Policy result = service.enablePolicy("policy-1");

        assertNotNull(result);
        verify(policyRepo).save(testPolicy);
    }

    @Test
    void enablePolicy_throwsWhenNotFound() {
        when(policyRepo.findById("nonexistent")).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> service.enablePolicy("nonexistent"));
    }

    @Test
    void disablePolicy_disablesAndReturns() {
        when(policyRepo.findById("policy-1")).thenReturn(Optional.of(testPolicy));
        when(policyRepo.save(any())).thenReturn(testPolicy);

        Policy result = service.disablePolicy("policy-1");

        assertNotNull(result);
        verify(policyRepo).save(testPolicy);
    }

    @Test
    void enforcePolicy_enforcesAndReturns() {
        when(policyRepo.findById("policy-1")).thenReturn(Optional.of(testPolicy));
        when(policyRepo.save(any())).thenReturn(testPolicy);

        Policy result = service.enforcePolicy("policy-1");

        assertNotNull(result);
        verify(policyRepo).save(testPolicy);
    }
}
