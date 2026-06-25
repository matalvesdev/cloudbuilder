package com.cloudbuilder.git.infrastructure;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * JPA entity for git commits stored from webhook payloads.
 * <p>
 * Maps to the {@code git_commits} table and serves as the persistence
 * representation of {@link com.cloudbuilder.git.domain.model.Commit}.
 */
@Entity
@Table(name = "git_commits", indexes = {
    @Index(name = "idx_git_commits_repo_id", columnList = "repoId"),
    @Index(name = "idx_git_commits_sha", columnList = "sha"),
    @Index(name = "idx_git_commits_timestamp", columnList = "timestamp DESC")
})
public class CommitEntity {

    @Id
    private String id;

    @Column(name = "repo_id", nullable = false)
    private String repoId;

    @Column(nullable = false, length = 40)
    private String sha;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false)
    private String author;

    @Column(name = "author_email")
    private String authorEmail;

    @Column(nullable = false)
    private Instant timestamp;

    @Column(name = "received_at", nullable = false, updatable = false)
    private Instant receivedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @Version
    private Long version;

    protected CommitEntity() {}

    public CommitEntity(String id, String repoId, String sha, String message,
                        String author, String authorEmail, Instant timestamp,
                        Instant receivedAt) {
        this.id = id;
        this.repoId = repoId;
        this.sha = sha;
        this.message = message;
        this.author = author;
        this.authorEmail = authorEmail;
        this.timestamp = timestamp;
        this.receivedAt = receivedAt;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRepoId() { return repoId; }
    public void setRepoId(String repoId) { this.repoId = repoId; }

    public String getSha() { return sha; }
    public void setSha(String sha) { this.sha = sha; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public String getAuthorEmail() { return authorEmail; }
    public void setAuthorEmail(String authorEmail) { this.authorEmail = authorEmail; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public Instant getReceivedAt() { return receivedAt; }

    public Instant getCreatedAt() { return createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }

    public Long getVersion() { return version; }
}
