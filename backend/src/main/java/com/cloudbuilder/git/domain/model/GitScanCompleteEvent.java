package com.cloudbuilder.git.domain.model;

import java.time.Instant;

/**
 * Domain event published when a repository scan completes successfully.
 * <p>
 * Handlers (e.g., ProvisionService for deployment suggestion, ObserveService
 * for service map updates) subscribe via {@code @TransactionalEventListener}.
 * <p>
 * Per ADR-016: scan → detect changes → suggest deployment / update service map.
 */
public class GitScanCompleteEvent {

    private final String repoId;
    private final RepositoryScan scanResult;
    private final Instant occurredAt;

    /**
     * Create a GitScanCompleteEvent.
     *
     * @param repoId     the repository identifier
     * @param scanResult the completed scan result
     */
    public GitScanCompleteEvent(String repoId, RepositoryScan scanResult) {
        this.repoId = repoId;
        this.scanResult = scanResult;
        this.occurredAt = Instant.now();
    }

    public String getRepoId() {
        return repoId;
    }

    public RepositoryScan getScanResult() {
        return scanResult;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }
}
