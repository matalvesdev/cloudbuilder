package com.cloudbuilder.git.domain.model;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

/**
 * Domain event published when a git push is received via webhook.
 * <p>
 * Handlers (e.g., GitScannerService) subscribe via {@code @TransactionalEventListener}
 * and perform incremental scans on the pushed commits.
 * <p>
 * Per ADR-016: push → scan → detect changes → suggest deployment.
 */
public class GitPushEvent {

    private final String repoId;
    private final List<String> commits;
    private final String branch;
    private final Instant occurredAt;

    /**
     * Create a GitPushEvent.
     *
     * @param repoId  the repository identifier
     * @param commits list of commit SHAs included in this push
     * @param branch  the branch that received the push
     */
    public GitPushEvent(String repoId, List<String> commits, String branch) {
        this.repoId = repoId;
        this.commits = commits != null ? List.copyOf(commits) : Collections.emptyList();
        this.branch = branch;
        this.occurredAt = Instant.now();
    }

    public String getRepoId() {
        return repoId;
    }

    public List<String> getCommits() {
        return commits;
    }

    public String getBranch() {
        return branch;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }
}
