package com.cloudbuilder.credential.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "credentials")
public class Credential {

    @Id
    private String id;

    @Column(nullable = false)
    private String tenantId;

    @Column(name = "organization_id")
    private String organizationId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String provider;

    @Column(nullable = false)
    private String authType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String encryptedPayload;

    @Column(nullable = false)
    private boolean isActive;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected Credential() {}

    public Credential(String tenantId, String name, String provider, String authType, String encryptedPayload) {
        this.id = UUID.randomUUID().toString();
        this.tenantId = tenantId;
        this.name = name;
        this.provider = provider;
        this.authType = authType;
        this.encryptedPayload = encryptedPayload;
        this.isActive = true;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public String getTenantId() { return tenantId; }
    public String getOrganizationId() { return organizationId; }
    public void setOrganizationId(String organizationId) { this.organizationId = organizationId; }
    public String getName() { return name; }
    public String getProvider() { return provider; }
    public String getAuthType() { return authType; }
    public String getEncryptedPayload() { return encryptedPayload; }
    public boolean isActive() { return isActive; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void setName(String name) { this.name = name; }
    public void setProvider(String provider) { this.provider = provider; }
    public void setAuthType(String authType) { this.authType = authType; }
    public void setEncryptedPayload(String encryptedPayload) { this.encryptedPayload = encryptedPayload; }
    public void setActive(boolean isActive) { this.isActive = isActive; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
