package com.cloudbuilder.platform.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "partner_integrations")
public class PartnerIntegration {

    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_INACTIVE = "INACTIVE";
    public static final String STATUS_PENDING = "PENDING";

    @Id
    private UUID id;

    @Column(name = "partner_name", nullable = false)
    private String partnerName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "integration_type", nullable = false)
    private String integrationType;

    @Column(name = "api_endpoint")
    private String apiEndpoint;

    @Column(name = "api_key_encrypted")
    private String apiKeyEncrypted;

    @Column(nullable = false)
    private String status;

    @Column(columnDefinition = "TEXT")
    private String configuration;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected PartnerIntegration() {}

    public PartnerIntegration(String partnerName, String description, String integrationType) {
        this.id = UUID.randomUUID();
        this.partnerName = partnerName;
        this.description = description;
        this.integrationType = integrationType;
        this.status = STATUS_PENDING;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public String getPartnerName() { return partnerName; }
    public void setPartnerName(String partnerName) { this.partnerName = partnerName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getIntegrationType() { return integrationType; }
    public String getApiEndpoint() { return apiEndpoint; }
    public void setApiEndpoint(String apiEndpoint) { this.apiEndpoint = apiEndpoint; }
    public String getApiKeyEncrypted() { return apiKeyEncrypted; }
    public void setApiKeyEncrypted(String apiKeyEncrypted) { this.apiKeyEncrypted = apiKeyEncrypted; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getConfiguration() { return configuration; }
    public void setConfiguration(String configuration) { this.configuration = configuration; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
