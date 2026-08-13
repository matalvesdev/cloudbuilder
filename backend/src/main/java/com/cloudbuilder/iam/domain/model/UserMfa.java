package com.cloudbuilder.iam.domain.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.UUID;

/**
 * Multi-Factor Authentication configuration per user.
 * Supports TOTP (Time-based One-Time Password) via shared secret.
 */
@Entity
@Table(name = "iam_user_mfa")
public class UserMfa {

    @Id
    private String id;

    @Column(name = "user_id", nullable = false, unique = true)
    private String userId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String secret;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "backup_codes", columnDefinition = "TEXT")
    private String backupCodes;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @Column(name = "last_verified_at")
    private Instant lastVerifiedAt;

    protected UserMfa() {}

    public UserMfa(String userId) {
        this.id = UUID.randomUUID().toString();
        this.userId = userId;
        this.secret = generateSecret();
        this.enabled = false;
        this.backupCodes = generateBackupCodes();
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public String getUserId() { return userId; }
    @JsonIgnore
    public String getSecret() { return secret; }
    public void setSecret(String secret) { this.secret = secret; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; this.updatedAt = Instant.now(); }
    @JsonIgnore
    public String getBackupCodes() { return backupCodes; }
    public void setBackupCodes(String backupCodes) { this.backupCodes = backupCodes; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public Instant getLastVerifiedAt() { return lastVerifiedAt; }
    public void setLastVerifiedAt(Instant lastVerifiedAt) { this.lastVerifiedAt = lastVerifiedAt; }

    private static String generateSecret() {
        return MfaSecretCodec.generate();
    }

    private static String generateBackupCodes() {
        SecureRandom random = new SecureRandom();
        StringBuilder codes = new StringBuilder();
        for (int i = 0; i < 8; i++) {
            if (i > 0) codes.append(",");
            // Generate 8-character alphanumeric backup code
            byte[] codeBytes = new byte[6];
            random.nextBytes(codeBytes);
            String code = java.util.HexFormat.of().formatHex(codeBytes)
                    .substring(0, 8).toUpperCase();
            codes.append(code);
        }
        return codes.toString();
    }
}
