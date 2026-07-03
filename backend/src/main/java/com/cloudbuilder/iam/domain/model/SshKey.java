package com.cloudbuilder.iam.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * SshKey: SSH public key for Git operations and server access.
 */
@Entity
@Table(name = "ssh_keys", indexes = {
    @Index(name = "idx_sshkey_user", columnList = "userId")
})
public class SshKey {

    @Id
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(nullable = false)
    private String name;

    @Column(name = "public_key", nullable = false, columnDefinition = "TEXT")
    private String publicKey;

    @Column(name = "fingerprint")
    private String fingerprint;

    @Column(name = "last_used_at")
    private Instant lastUsedAt;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected SshKey() {}

    public SshKey(String userId, String tenantId, String name, String publicKey, String fingerprint) {
        this.id = UUID.randomUUID().toString();
        this.userId = userId;
        this.tenantId = tenantId;
        this.name = name;
        this.publicKey = publicKey;
        this.fingerprint = fingerprint;
        this.active = true;
        this.createdAt = Instant.now();
    }

    public void revoke() { this.active = false; }
    public void recordUsage() { this.lastUsedAt = Instant.now(); }

    public String getId() { return id; }
    public String getUserId() { return userId; }
    public String getTenantId() { return tenantId; }
    public String getName() { return name; }
    public String getPublicKey() { return publicKey; }
    public String getFingerprint() { return fingerprint; }
    public Instant getLastUsedAt() { return lastUsedAt; }
    public boolean isActive() { return active; }
    public Instant getCreatedAt() { return createdAt; }
}
