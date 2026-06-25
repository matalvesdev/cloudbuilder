package com.cloudbuilder.approval.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "approval_votes")
public class ApprovalVote {

    public enum Vote {
        APPROVE, REJECT
    }

    @Id
    private String id;

    @Column(nullable = false)
    private String approvalRequestId;

    @Column(nullable = false)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Vote vote;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected ApprovalVote() {}

    public ApprovalVote(String approvalRequestId, String userId, Vote vote, String comment) {
        this.id = UUID.randomUUID().toString();
        this.approvalRequestId = approvalRequestId;
        this.userId = userId;
        this.vote = vote;
        this.comment = comment;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public String getApprovalRequestId() { return approvalRequestId; }
    public String getUserId() { return userId; }
    public Vote getVote() { return vote; }
    public String getComment() { return comment; }
    public Instant getCreatedAt() { return createdAt; }
}
