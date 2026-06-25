package com.cloudbuilder.approval.domain.service;

import com.cloudbuilder.approval.domain.model.ApprovalRequest;
import com.cloudbuilder.approval.domain.model.ApprovalRule;
import com.cloudbuilder.approval.domain.model.ApprovalVote;
import com.cloudbuilder.approval.domain.port.ApprovalRequestRepository;
import com.cloudbuilder.approval.domain.port.ApprovalRuleRepository;
import com.cloudbuilder.approval.domain.port.ApprovalVoteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ApprovalService {

    private final ApprovalRuleRepository approvalRuleRepository;
    private final ApprovalRequestRepository approvalRequestRepository;
    private final ApprovalVoteRepository approvalVoteRepository;

    public ApprovalService(ApprovalRuleRepository approvalRuleRepository,
                           ApprovalRequestRepository approvalRequestRepository,
                           ApprovalVoteRepository approvalVoteRepository) {
        this.approvalRuleRepository = approvalRuleRepository;
        this.approvalRequestRepository = approvalRequestRepository;
        this.approvalVoteRepository = approvalVoteRepository;
    }

    // ─── Rules ────────────────────────────────────────────────────────

    public ApprovalRule createRule(ApprovalRule rule) {
        return approvalRuleRepository.save(rule);
    }

    @Transactional(readOnly = true)
    public List<ApprovalRule> listRules(String tenantId) {
        return approvalRuleRepository.findByTenantId(tenantId);
    }

    @Transactional(readOnly = true)
    public Optional<ApprovalRule> findRuleById(String id) {
        return approvalRuleRepository.findById(id);
    }

    public Optional<ApprovalRule> updateRule(String id, boolean requiresApproval,
                                              String approversJson, int minApprovals) {
        return approvalRuleRepository.findById(id).map(rule -> {
            rule.setRequiresApproval(requiresApproval);
            rule.setApproversJson(approversJson);
            rule.setMinApprovals(minApprovals);
            rule.setUpdatedAt(Instant.now());
            return approvalRuleRepository.save(rule);
        });
    }

    public void deleteRule(String id) {
        approvalRuleRepository.deleteById(id);
    }

    // ─── Requests ─────────────────────────────────────────────────────

    public ApprovalRequest submitRequest(ApprovalRequest request) {
        return approvalRequestRepository.save(request);
    }

    @Transactional(readOnly = true)
    public List<ApprovalRequest> listRequestsByEnvironment(String environmentId) {
        return approvalRequestRepository.findByEnvironmentIdOrderByCreatedAtDesc(environmentId);
    }

    @Transactional(readOnly = true)
    public Optional<ApprovalRequest> findRequestById(String id) {
        return approvalRequestRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<ApprovalVote> getVotesForRequest(String approvalRequestId) {
        return approvalVoteRepository.findByApprovalRequestId(approvalRequestId);
    }

    // ─── Voting ───────────────────────────────────────────────────────

    public ApprovalVote castVote(String approvalRequestId, String userId,
                                  ApprovalVote.Vote vote, String comment) {
        var approvalVote = new ApprovalVote(approvalRequestId, userId, vote, comment);
        var saved = approvalVoteRepository.save(approvalVote);

        resolveIfComplete(approvalRequestId);
        return saved;
    }

    private void resolveIfComplete(String approvalRequestId) {
        var requestOpt = approvalRequestRepository.findById(approvalRequestId);
        if (requestOpt.isEmpty() || requestOpt.get().getStatus() != ApprovalRequest.Status.PENDING) {
            return;
        }

        var request = requestOpt.get();
        var ruleOpt = approvalRuleRepository.findByEnvironmentId(request.getEnvironmentId());
        if (ruleOpt.isEmpty()) {
            return;
        }

        var rule = ruleOpt.get();
        var approveCount = approvalVoteRepository.countByApprovalRequestIdAndVote(
                approvalRequestId, ApprovalVote.Vote.APPROVE);
        var rejectCount = approvalVoteRepository.countByApprovalRequestIdAndVote(
                approvalRequestId, ApprovalVote.Vote.REJECT);

        if (approveCount >= rule.getMinApprovals()) {
            request.setStatus(ApprovalRequest.Status.APPROVED);
            request.setResolvedAt(Instant.now());
            approvalRequestRepository.save(request);
        } else if (rejectCount >= rule.getMinApprovals()) {
            request.setStatus(ApprovalRequest.Status.REJECTED);
            request.setResolvedAt(Instant.now());
            approvalRequestRepository.save(request);
        }
    }
}
