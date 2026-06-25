package com.cloudbuilder.approval.application.dto;

import com.cloudbuilder.approval.domain.model.ApprovalRequest;
import com.cloudbuilder.approval.domain.model.ApprovalRequest.RequestType;
import com.cloudbuilder.approval.domain.model.ApprovalRequest.Status;
import com.cloudbuilder.approval.domain.model.ApprovalVote;
import java.time.Instant;
import java.util.List;

public record ApprovalRequestDTO(
    String id,
    String tenantId,
    String environmentId,
    RequestType requestType,
    String requestedBy,
    Status status,
    Instant createdAt,
    Instant resolvedAt,
    List<ApprovalVoteDTO> votes
) {
    public static ApprovalRequestDTO from(ApprovalRequest req, List<ApprovalVote> votes) {
        return new ApprovalRequestDTO(
            req.getId(), req.getTenantId(), req.getEnvironmentId(),
            req.getRequestType(), req.getRequestedBy(), req.getStatus(),
            req.getCreatedAt(), req.getResolvedAt(),
            votes.stream().map(ApprovalVoteDTO::from).toList());
    }

    public record ApprovalVoteDTO(
        String id,
        String userId,
        String vote,
        String comment,
        Instant createdAt
    ) {
        public static ApprovalVoteDTO from(ApprovalVote v) {
            return new ApprovalVoteDTO(
                v.getId(), v.getUserId(),
                v.getVote().name(), v.getComment(), v.getCreatedAt());
        }
    }
}
