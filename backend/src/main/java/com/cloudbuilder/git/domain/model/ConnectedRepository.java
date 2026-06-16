package com.cloudbuilder.git.domain.model;

import java.time.Instant;
import java.util.UUID;

public class ConnectedRepository {

    public enum Provider {
        GITHUB,
        GITLAB,
        BITBUCKET
    }

    public enum Status {
        CONNECTED,
        SCANNING,
        ERROR,
        DISCONNECTED
    }

    private UUID id;
    private Provider provider;
    private String repoUrl;
    private String repoName;
    private String fullName;
    private String owner;
    private String defaultBranch;
    private String accessToken;
    private Instant connectedAt;
    private Instant lastScanAt;
    private Status status;

    public ConnectedRepository() {
    }

    public ConnectedRepository(Provider provider, String repoUrl, String repoName,
                                String fullName, String owner, String defaultBranch,
                                String accessToken) {
        this.id = UUID.randomUUID();
        this.provider = provider;
        this.repoUrl = repoUrl;
        this.repoName = repoName;
        this.fullName = fullName;
        this.owner = owner;
        this.defaultBranch = defaultBranch;
        this.accessToken = accessToken;
        this.connectedAt = Instant.now();
        this.status = Status.CONNECTED;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Provider getProvider() {
        return provider;
    }

    public void setProvider(Provider provider) {
        this.provider = provider;
    }

    public String getRepoUrl() {
        return repoUrl;
    }

    public void setRepoUrl(String repoUrl) {
        this.repoUrl = repoUrl;
    }

    public String getRepoName() {
        return repoName;
    }

    public void setRepoName(String repoName) {
        this.repoName = repoName;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getOwner() {
        return owner;
    }

    public void setOwner(String owner) {
        this.owner = owner;
    }

    public String getDefaultBranch() {
        return defaultBranch;
    }

    public void setDefaultBranch(String defaultBranch) {
        this.defaultBranch = defaultBranch;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public Instant getConnectedAt() {
        return connectedAt;
    }

    public void setConnectedAt(Instant connectedAt) {
        this.connectedAt = connectedAt;
    }

    public Instant getLastScanAt() {
        return lastScanAt;
    }

    public void setLastScanAt(Instant lastScanAt) {
        this.lastScanAt = lastScanAt;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }
}
