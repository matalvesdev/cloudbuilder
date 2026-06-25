package com.cloudbuilder.approval.application.dto;

import com.cloudbuilder.approval.domain.model.ApprovalVote.Vote;
import jakarta.validation.constraints.NotBlank;

public record ApprovalVoteRequest(
    @NotBlank String userId,
    @NotBlank Vote vote,
    String comment
) {}
