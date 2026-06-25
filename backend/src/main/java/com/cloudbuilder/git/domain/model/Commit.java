package com.cloudbuilder.git.domain.model;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain model representing a single git commit stored from webhook payloads.
 * <p>
 * Per ADR-016: Webhook payloads already contain commit data (sha, message, author,
 * timestamp) — store them and serve from local DB. No additional GitHub API calls
 * needed for commit history.
 */
public class Commit {

    private String id;
    private String repoId;
    private String sha;
    private String message;
    private String author;
    private String authorEmail;
    private Instant timestamp;
    private Instant receivedAt;

    public Commit() {}

    /**
     * Create a new Commit from webhook data.
     *
     * @param repoId    the repository this commit belongs to
     * @param sha       the commit SHA (40-character hex)
     * @param message   the commit message
     * @param author    the author name
     * @param timestamp when the commit was authored
     */
    public Commit(String repoId, String sha, String message, String author, Instant timestamp) {
        this.id = UUID.randomUUID().toString();
        this.repoId = repoId;
        this.sha = sha;
        this.message = message;
        this.author = author;
        this.timestamp = timestamp;
        this.receivedAt = Instant.now();
    }

    /**
     * Create a new Commit with author email.
     */
    public Commit(String repoId, String sha, String message, String author,
                  String authorEmail, Instant timestamp) {
        this(repoId, sha, message, author, timestamp);
        this.authorEmail = authorEmail;
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
    public void setReceivedAt(Instant receivedAt) { this.receivedAt = receivedAt; }
}
