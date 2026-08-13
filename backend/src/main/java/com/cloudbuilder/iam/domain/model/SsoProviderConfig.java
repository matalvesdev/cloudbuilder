package com.cloudbuilder.iam.domain.model;

import com.cloudbuilder.shared.security.SecretEncryptionConverter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "sso_provider_configs")
public class SsoProviderConfig {

    @Id
    private String id;

    @Column(nullable = false)
    private String providerType;

    @Column(nullable = false)
    private String providerName;

    @Column(nullable = false)
    private String clientId;

    @Column(nullable = false)
    @Convert(converter = SecretEncryptionConverter.class)
    private String clientSecret;

    @Column(nullable = false)
    private boolean enabled;

    @Column(columnDefinition = "TEXT")
    private String allowedDomains;

    private String metadataUrl;

    @Column(nullable = false)
    private String tenantId;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected SsoProviderConfig() {}

    public SsoProviderConfig(String providerType, String providerName, String clientId,
                             String clientSecret, String tenantId) {
        this.id = UUID.randomUUID().toString();
        this.providerType = providerType;
        this.providerName = providerName;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.enabled = true;
        this.tenantId = tenantId;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public String getProviderType() { return providerType; }
    public void setProviderType(String providerType) { this.providerType = providerType; }
    public String getProviderName() { return providerName; }
    public void setProviderName(String providerName) { this.providerName = providerName; }
    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }
    @JsonIgnore
    public String getClientSecret() { return clientSecret; }
    public void setClientSecret(String clientSecret) { this.clientSecret = clientSecret; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public String getAllowedDomains() { return allowedDomains; }
    public void setAllowedDomains(String allowedDomains) { this.allowedDomains = allowedDomains; }
    public String getMetadataUrl() { return metadataUrl; }
    public void setMetadataUrl(String metadataUrl) { this.metadataUrl = metadataUrl; }
    public String getTenantId() { return tenantId; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
