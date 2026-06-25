package com.cloudbuilder.approval.domain.port;

import com.cloudbuilder.approval.domain.model.ApprovalVote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApprovalVoteRepository extends JpaRepository<ApprovalVote, String> {
    List<ApprovalVote> findByApprovalRequestId(String approvalRequestId);
    long countByApprovalRequestIdAndVote(String approvalRequestId, ApprovalVote.Vote vote);
}
