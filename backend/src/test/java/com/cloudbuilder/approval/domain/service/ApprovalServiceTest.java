package com.cloudbuilder.approval.domain.service;

import com.cloudbuilder.approval.domain.model.ApprovalRequest;
import com.cloudbuilder.approval.domain.model.ApprovalRule;
import com.cloudbuilder.approval.domain.model.ApprovalVote;
import com.cloudbuilder.approval.domain.port.ApprovalRequestRepository;
import com.cloudbuilder.approval.domain.port.ApprovalRuleRepository;
import com.cloudbuilder.approval.domain.port.ApprovalVoteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApprovalServiceTest {

    @Mock
    private ApprovalRuleRepository ruleRepository;

    @Mock
    private ApprovalRequestRepository requestRepository;

    @Mock
    private ApprovalVoteRepository voteRepository;

    private ApprovalService service;

    @BeforeEach
    void setUp() {
        service = new ApprovalService(ruleRepository, requestRepository, voteRepository);
    }

    // ── Rules ───────────────────────────────────────────────────────

    @Test
    void createRule_ShouldSaveAndReturn() {
        var rule = new ApprovalRule("t-1", "env-1", true, "[\"admin\"]", 1);
        when(ruleRepository.save(any(ApprovalRule.class))).thenReturn(rule);

        var result = service.createRule(rule);

        assertNotNull(result);
        assertEquals("t-1", result.getTenantId());
        verify(ruleRepository).save(rule);
    }

    @Test
    void listRules_ShouldReturnByTenant() {
        var rule = new ApprovalRule("t-1", "env-1", true, "[]", 1);
        when(ruleRepository.findByTenantId("t-1")).thenReturn(List.of(rule));

        var result = service.listRules("t-1");

        assertEquals(1, result.size());
        verify(ruleRepository).findByTenantId("t-1");
    }

    @Test
    void findRuleById_WhenExists_ShouldReturn() {
        var rule = new ApprovalRule("t-1", "env-1", true, "[]", 1);
        when(ruleRepository.findById("r-1")).thenReturn(Optional.of(rule));

        assertTrue(service.findRuleById("r-1").isPresent());
    }

    @Test
    void updateRule_WhenFound_ShouldUpdate() {
        var rule = new ApprovalRule("t-1", "env-1", false, "[]", 0);
        when(ruleRepository.findById("r-1")).thenReturn(Optional.of(rule));
        when(ruleRepository.save(any(ApprovalRule.class))).thenAnswer(inv -> inv.getArgument(0));

        var result = service.updateRule("r-1", true, "[\"admin\"]", 2);

        assertTrue(result.isPresent());
        assertTrue(result.get().isRequiresApproval());
        assertEquals("[\"admin\"]", result.get().getApproversJson());
        assertEquals(2, result.get().getMinApprovals());
    }

    @Test
    void updateRule_WhenNotFound_ShouldReturnEmpty() {
        when(ruleRepository.findById("missing")).thenReturn(Optional.empty());

        assertTrue(service.updateRule("missing", true, "[]", 1).isEmpty());
    }

    @Test
    void deleteRule_ShouldCallRepository() {
        service.deleteRule("r-1");
        verify(ruleRepository).deleteById("r-1");
    }

    // ── Requests ────────────────────────────────────────────────────

    @Test
    void submitRequest_ShouldSaveAndReturn() {
        var request = new ApprovalRequest("t-1", "env-1", ApprovalRequest.RequestType.DEPLOY, "user-1");
        when(requestRepository.save(any(ApprovalRequest.class))).thenReturn(request);

        var result = service.submitRequest(request);

        assertNotNull(result);
        assertEquals(ApprovalRequest.Status.PENDING, result.getStatus());
        verify(requestRepository).save(request);
    }

    @Test
    void listRequestsByEnvironment_ShouldReturn() {
        var request = new ApprovalRequest("t-1", "env-1", ApprovalRequest.RequestType.DEPLOY, "user-1");
        when(requestRepository.findByEnvironmentIdOrderByCreatedAtDesc("env-1"))
                .thenReturn(List.of(request));

        var result = service.listRequestsByEnvironment("env-1");

        assertEquals(1, result.size());
    }

    @Test
    void findRequestById_WhenExists_ShouldReturn() {
        var request = new ApprovalRequest("t-1", "env-1", ApprovalRequest.RequestType.DEPLOY, "user-1");
        when(requestRepository.findById("req-1")).thenReturn(Optional.of(request));

        assertTrue(service.findRequestById("req-1").isPresent());
    }

    @Test
    void getVotesForRequest_ShouldReturn() {
        var vote = new ApprovalVote("req-1", "user-1", ApprovalVote.Vote.APPROVE, "LGTM");
        when(voteRepository.findByApprovalRequestId("req-1")).thenReturn(List.of(vote));

        var result = service.getVotesForRequest("req-1");

        assertEquals(1, result.size());
        assertEquals("user-1", result.get(0).getUserId());
    }

    // ── Voting ──────────────────────────────────────────────────────

    @Test
    void castVote_ShouldSaveAndCallResolve() {
        var request = new ApprovalRequest("t-1", "env-1", ApprovalRequest.RequestType.DEPLOY, "user-1");
        var rule = new ApprovalRule("t-1", "env-1", true, "[\"admin\"]", 1);
        when(requestRepository.findById("req-1")).thenReturn(Optional.of(request));
        when(ruleRepository.findByEnvironmentId("env-1")).thenReturn(Optional.of(rule));
        when(voteRepository.countByApprovalRequestIdAndVote("req-1", ApprovalVote.Vote.APPROVE))
                .thenReturn(1L);
        when(voteRepository.save(any(ApprovalVote.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        var vote = service.castVote("req-1", "admin-1", ApprovalVote.Vote.APPROVE, "Looks good");

        assertNotNull(vote);
        assertEquals("admin-1", vote.getUserId());
        // approve count (1) >= minApprovals (1) → request should be APPROVED
        assertEquals(ApprovalRequest.Status.APPROVED, request.getStatus());
        assertNotNull(request.getResolvedAt());
    }

    @Test
    void castVote_RejectCount_MeetsMin_ShouldReject() {
        var request = new ApprovalRequest("t-1", "env-1", ApprovalRequest.RequestType.DEPLOY, "user-1");
        var rule = new ApprovalRule("t-1", "env-1", true, "[\"admin\"]", 2);
        when(requestRepository.findById("req-1")).thenReturn(Optional.of(request));
        when(ruleRepository.findByEnvironmentId("env-1")).thenReturn(Optional.of(rule));
        when(voteRepository.countByApprovalRequestIdAndVote("req-1", ApprovalVote.Vote.APPROVE))
                .thenReturn(0L);
        when(voteRepository.countByApprovalRequestIdAndVote("req-1", ApprovalVote.Vote.REJECT))
                .thenReturn(2L);
        when(voteRepository.save(any(ApprovalVote.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        service.castVote("req-1", "admin-1", ApprovalVote.Vote.REJECT, "Denied");

        assertEquals(ApprovalRequest.Status.REJECTED, request.getStatus());
    }

    @Test
    void castVote_NotEnoughVotes_ShouldStayPending() {
        var request = new ApprovalRequest("t-1", "env-1", ApprovalRequest.RequestType.DEPLOY, "user-1");
        var rule = new ApprovalRule("t-1", "env-1", true, "[\"admin\"]", 3);
        when(requestRepository.findById("req-1")).thenReturn(Optional.of(request));
        when(ruleRepository.findByEnvironmentId("env-1")).thenReturn(Optional.of(rule));
        when(voteRepository.countByApprovalRequestIdAndVote("req-1", ApprovalVote.Vote.APPROVE))
                .thenReturn(1L);
        when(voteRepository.countByApprovalRequestIdAndVote("req-1", ApprovalVote.Vote.REJECT))
                .thenReturn(0L);
        when(voteRepository.save(any(ApprovalVote.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        service.castVote("req-1", "admin-1", ApprovalVote.Vote.APPROVE, "Partial");

        assertEquals(ApprovalRequest.Status.PENDING, request.getStatus());
        assertNull(request.getResolvedAt());
    }

    @Test
    void castVote_RequestAlreadyResolved_ShouldNotChange() {
        var request = new ApprovalRequest("t-1", "env-1", ApprovalRequest.RequestType.DEPLOY, "user-1");
        request.setStatus(ApprovalRequest.Status.APPROVED);
        when(requestRepository.findById("req-1")).thenReturn(Optional.of(request));
        when(voteRepository.save(any(ApprovalVote.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        service.castVote("req-1", "admin-1", ApprovalVote.Vote.APPROVE, "Late vote");

        assertEquals(ApprovalRequest.Status.APPROVED, request.getStatus());
        // rule lookup should NOT be called since request is not PENDING
        verify(ruleRepository, never()).findByEnvironmentId(anyString());
    }

    @Test
    void castVote_NoRuleFound_ShouldStayPending() {
        var request = new ApprovalRequest("t-1", "env-1", ApprovalRequest.RequestType.DEPLOY, "user-1");
        when(requestRepository.findById("req-1")).thenReturn(Optional.of(request));
        when(ruleRepository.findByEnvironmentId("env-1")).thenReturn(Optional.empty());
        when(voteRepository.save(any(ApprovalVote.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        service.castVote("req-1", "admin-1", ApprovalVote.Vote.APPROVE, "No rule");

        assertEquals(ApprovalRequest.Status.PENDING, request.getStatus());
    }

    @Test
    void castVote_RequestNotFound_ShouldNotThrow() {
        when(requestRepository.findById("missing")).thenReturn(Optional.empty());
        when(voteRepository.save(any(ApprovalVote.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        assertDoesNotThrow(() -> service.castVote("missing", "user-1", ApprovalVote.Vote.APPROVE, "ok"));
    }
}
