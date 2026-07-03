package com.cloudbuilder.iam.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * ApiToken: API access token for programmatic access.
 */
@Entity
@Table(name = "api_tokens", indexes = {
    @Index(name = "idx_token_user", columnList = "userId"),
    @Index(name = "idx_token_hash", columnList = "tokenHash", unique = true)
})
public class ApiToken {

    @Id
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(nullable = false)
    private String name;

    @Column(name = "token_hash", nullable = false, unique = true)
    private String tokenHash;

    @Column(name = "token_prefix", nullable = false)
    private String tokenPrefix;

    @Column(columnDefinition = "TEXT")
    private String scopes;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "last_used_at")
    private Instant lastUsedAt;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected ApiToken() {}

    public ApiToken(String userId, String tenantId, String name, String tokenHash, String tokenPrefix, String scopes) {
        this.id = UUID.randomUUID().toString();
        this.userId = userId;
        this.tenantId = tenantId;
        this.name = name;
        this.tokenHash = tokenHash;
        this.tokenPrefix = tokenPrefix;
        this.scopes = scopes;
        this.active = true;
        this.createdAt = Instant.now();
    }

    public void revoke() { this.active = false; }
    public void recordUsage() { this.lastUsedAt = Instant.now(); }

    public String getId() { return id; }
    public String getUserId() { return userId; }
    public String getTenantId() { return tenantId; }
    public String getName() { return name; }
    public String getTokenHash() { return tokenHash; }
    public String getTokenPrefix() { return tokenPrefix; }
    public String getScopes() { return scopes; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
    public Instant getLastUsedAt() { return lastUsedAt; }
    public boolean isActive() { return active; }
    public Instant getCreatedAt() { return createdAt; }
}
