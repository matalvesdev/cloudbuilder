package com.cloudbuilder.policy.infrastructure.web;

import com.cloudbuilder.policy.application.dto.PolicyDTO;
import com.cloudbuilder.policy.domain.model.Policy;
import com.cloudbuilder.policy.domain.service.PolicyService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/policies")
@PreAuthorize("isAuthenticated()")
public class PolicyController {

    private final PolicyService policyService;

    public PolicyController(PolicyService policyService) {
        this.policyService = policyService;
    }

    @PostMapping
    public ResponseEntity<PolicyDTO> createPolicy(
            @RequestParam String tenantId,
            @RequestBody Map<String, Object> body) {
        Policy policy = policyService.createPolicy(
            tenantId,
            (String) body.get("name"),
            (String) body.get("description"),
            Policy.PolicyType.valueOf((String) body.get("type")),
            Policy.PolicySeverity.valueOf((String) body.get("severity")),
            (String) body.get("regoRule")
        );
        return ResponseEntity.ok(PolicyDTO.from(policy));
    }

    @GetMapping
    public ResponseEntity<Page<PolicyDTO>> listPolicies(
            @RequestParam String tenantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(
            policyService.listPolicies(tenantId, PageRequest.of(page, size))
                .map(PolicyDTO::from)
        );
    }

    @GetMapping("/active")
    public ResponseEntity<?> listActivePolicies(@RequestParam String tenantId) {
        return ResponseEntity.ok(
            policyService.getActivePolicies(tenantId).stream()
                .map(PolicyDTO::from)
                .toList()
        );
    }

    @PostMapping("/{id}/enable")
    public ResponseEntity<PolicyDTO> enablePolicy(@PathVariable String id) {
        return ResponseEntity.ok(PolicyDTO.from(policyService.enablePolicy(id)));
    }

    @PostMapping("/{id}/disable")
    public ResponseEntity<PolicyDTO> disablePolicy(@PathVariable String id) {
        return ResponseEntity.ok(PolicyDTO.from(policyService.disablePolicy(id)));
    }

    @PostMapping("/{id}/enforce")
    public ResponseEntity<PolicyDTO> enforcePolicy(@PathVariable String id) {
        return ResponseEntity.ok(PolicyDTO.from(policyService.enforcePolicy(id)));
    }
}
