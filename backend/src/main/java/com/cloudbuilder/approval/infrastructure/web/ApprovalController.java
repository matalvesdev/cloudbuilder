package com.cloudbuilder.approval.infrastructure.web;

import com.cloudbuilder.approval.application.dto.*;
import com.cloudbuilder.approval.domain.model.ApprovalRequest;
import com.cloudbuilder.approval.domain.model.ApprovalRule;
import com.cloudbuilder.approval.domain.model.ApprovalVote;
import com.cloudbuilder.approval.domain.service.ApprovalService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/approval")
@PreAuthorize("isAuthenticated()")
public class ApprovalController {

    private final ApprovalService approvalService;

    public ApprovalController(ApprovalService approvalService) {
        this.approvalService = approvalService;
    }

    // ─── Rules ────────────────────────────────────────────────────────

    @PostMapping("/rules")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<ApprovalRuleResponse> createRule(@Valid @RequestBody ApprovalRuleRequest req) {
        var rule = new ApprovalRule(req.tenantId(), req.environmentId(),
                req.requiresApproval(), req.approversJson(), req.minApprovals());
        var saved = approvalService.createRule(rule);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApprovalRuleResponse.from(saved));
    }

    @GetMapping("/rules")
    public ResponseEntity<List<ApprovalRuleResponse>> listRules(@RequestParam String tenantId) {
        var rules = approvalService.listRules(tenantId);
        var response = rules.stream().map(ApprovalRuleResponse::from).toList();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/rules/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<ApprovalRuleResponse> updateRule(@PathVariable String id,
                                                            @Valid @RequestBody UpdateApprovalRuleRequest req) {
        return approvalService.updateRule(id, req.requiresApproval(),
                        req.approversJson(), req.minApprovals())
                .map(r -> ResponseEntity.ok(ApprovalRuleResponse.from(r)))
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/rules/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteRule(@PathVariable String id) {
        approvalService.deleteRule(id);
        return ResponseEntity.noContent().build();
    }

    // ─── Requests ─────────────────────────────────────────────────────

    @PostMapping("/requests")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<ApprovalRequestDTO> submitRequest(@Valid @RequestBody SubmitApprovalRequest req) {
        var request = new ApprovalRequest(req.tenantId(), req.environmentId(),
                req.requestType(), req.requestedBy());
        var saved = approvalService.submitRequest(request);
        var votes = approvalService.getVotesForRequest(saved.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApprovalRequestDTO.from(saved, votes));
    }

    @GetMapping("/requests")
    public ResponseEntity<List<ApprovalRequestDTO>> listRequests(@RequestParam String environmentId) {
        var requests = approvalService.listRequestsByEnvironment(environmentId);
        var response = requests.stream()
                .map(r -> {
                    var votes = approvalService.getVotesForRequest(r.getId());
                    return ApprovalRequestDTO.from(r, votes);
                })
                .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/requests/{id}")
    public ResponseEntity<ApprovalRequestDTO> getRequest(@PathVariable String id) {
        return approvalService.findRequestById(id)
                .map(r -> {
                    var votes = approvalService.getVotesForRequest(r.getId());
                    return ResponseEntity.ok(ApprovalRequestDTO.from(r, votes));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── Voting ───────────────────────────────────────────────────────

    @PostMapping("/requests/{id}/approve")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<ApprovalRequestDTO> approve(@PathVariable String id,
                                                       @Valid @RequestBody ApprovalVoteRequest req) {
        approvalService.castVote(id, req.userId(), ApprovalVote.Vote.APPROVE, req.comment());
        return getRequest(id);
    }

    @PostMapping("/requests/{id}/reject")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<ApprovalRequestDTO> reject(@PathVariable String id,
                                                      @Valid @RequestBody ApprovalVoteRequest req) {
        approvalService.castVote(id, req.userId(), ApprovalVote.Vote.REJECT, req.comment());
        return getRequest(id);
    }
}
