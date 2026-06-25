package com.cloudbuilder.environment.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "managed_environments")
public class ManagedEnvironment {

    public enum Status {
        ACTIVE, INACTIVE, ERROR
    }

    @Id
    private String id;

    @Column(nullable = false)
    private String tenantId;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String provider;

    @Column(nullable = false)
    private String region;

    @Column(nullable = false)
    private String credentialsId;

    @Column(columnDefinition = "TEXT")
    private String configJson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected ManagedEnvironment() {}

    public ManagedEnvironment(String tenantId, String name, String provider,
                              String region, String credentialsId) {
        this.id = UUID.randomUUID().toString();
        this.tenantId = tenantId;
        this.name = name;
        this.provider = provider;
        this.region = region;
        this.credentialsId = credentialsId;
        this.status = Status.ACTIVE;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public String getTenantId() { return tenantId; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getProvider() { return provider; }
    public String getRegion() { return region; }
    public String getCredentialsId() { return credentialsId; }
    public String getConfigJson() { return configJson; }
    public Status getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void setName(String name) { this.name = name; }
    public void setDescription(String description) { this.description = description; }
    public void setProvider(String provider) { this.provider = provider; }
    public void setRegion(String region) { this.region = region; }
    public void setCredentialsId(String credentialsId) { this.credentialsId = credentialsId; }
    public void setConfigJson(String configJson) { this.configJson = configJson; }
    public void setStatus(Status status) { this.status = status; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
