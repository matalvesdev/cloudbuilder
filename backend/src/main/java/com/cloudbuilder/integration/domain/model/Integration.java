package com.cloudbuilder.integration.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Integration: Represents a connected external service/provider.
 */
@Entity
@Table(name = "integrations", indexes = {
    @Index(name = "idx_integration_tenant", columnList = "tenantId"),
    @Index(name = "idx_integration_category", columnList = "category"),
    @Index(name = "idx_integration_provider", columnList = "providerId")
})
public class Integration {

    @Id
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String providerId;

    @Column(nullable = false)
    private String category;

    @Column(columnDefinition = "TEXT")
    private String config;

    @Column(nullable = false)
    private String status = "PENDING";

    @Column(name = "health_status")
    private String healthStatus = "UNKNOWN";

    @Column(name = "last_health_check")
    private Instant lastHealthCheck;

    @Column(name = "last_sync_at")
    private Instant lastSyncAt;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Integration() {}

    public Integration(String tenantId, String userId, String name, String providerId, String category) {
        this.id = UUID.randomUUID().toString();
        this.tenantId = tenantId;
        this.userId = userId;
        this.name = name;
        this.providerId = providerId;
        this.category = category;
        this.status = "PENDING";
        this.healthStatus = "UNKNOWN";
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public void connect() { this.status = "CONNECTED"; this.updatedAt = Instant.now(); }
    public void disconnect() { this.status = "DISCONNECTED"; this.updatedAt = Instant.now(); }
    public void fail(String error) { this.status = "ERROR"; this.errorMessage = error; this.updatedAt = Instant.now(); }
    public void updateHealth(String status) { this.healthStatus = status; this.lastHealthCheck = Instant.now(); this.updatedAt = Instant.now(); }

    // Getters
    public String getId() { return id; }
    public String getTenantId() { return tenantId; }
    public String getUserId() { return userId; }
    public String getName() { return name; }
    public String getProviderId() { return providerId; }
    public String getCategory() { return category; }
    public String getConfig() { return config; }
    public void setConfig(String config) { this.config = config; }
    public String getStatus() { return status; }
    public String getHealthStatus() { return healthStatus; }
    public Instant getLastHealthCheck() { return lastHealthCheck; }
    public Instant getLastSyncAt() { return lastSyncAt; }
    public void setLastSyncAt(Instant lastSyncAt) { this.lastSyncAt = lastSyncAt; }
    public String getErrorMessage() { return errorMessage; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
