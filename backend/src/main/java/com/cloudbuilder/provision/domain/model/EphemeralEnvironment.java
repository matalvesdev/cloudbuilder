package com.cloudbuilder.provision.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ephemeral_environments")
public class EphemeralEnvironment {

    public static final String STATUS_CREATING = "CREATING";
    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_DESTROYING = "DESTROYING";
    public static final String STATUS_DESTROYED = "DESTROYED";

    @Id
    private UUID id;

    @Column(nullable = false)
    private String tenantId;

    @Column(nullable = false)
    private String projectId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String repoId;

    @Column(nullable = false)
    private String branchName;

    private Integer prNumber;

    @Column(columnDefinition = "TEXT")
    private String prUrl;

    @Column(nullable = false)
    private UUID sourceEnvironmentId;

    private String baseUrl;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private int ttlHours;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant expiresAt;

    private Instant destroyedAt;

    @Column(nullable = false)
    private double cost;

    @Column(nullable = false)
    private String resourceSize;

    @Column(columnDefinition = "TEXT")
    private String resourceConfig;

    protected EphemeralEnvironment() {}

    public EphemeralEnvironment(String tenantId, String projectId, String name,
                                 String repoId, String branchName, UUID sourceEnvironmentId,
                                 int ttlHours, String resourceSize) {
        this.id = UUID.randomUUID();
        this.tenantId = tenantId;
        this.projectId = projectId;
        this.name = name;
        this.repoId = repoId;
        this.branchName = branchName;
        this.sourceEnvironmentId = sourceEnvironmentId;
        this.status = STATUS_CREATING;
        this.ttlHours = ttlHours;
        this.resourceSize = resourceSize;
        this.createdAt = Instant.now();
        this.expiresAt = Instant.now().plusSeconds(ttlHours * 3600L);
        this.cost = calculateCost(ttlHours, resourceSize);
    }

    private double calculateCost(int ttlHours, String resourceSize) {
        double baseRate = 0.42;
        double sizeMultiplier = switch (resourceSize) {
            case "medium" -> 1.5;
            case "large" -> 2.5;
            default -> 1.0;
        };
        return Math.round(ttlHours * baseRate * sizeMultiplier * 100.0) / 100.0;
    }

    public void markActive(String baseUrl) {
        this.status = STATUS_ACTIVE;
        this.baseUrl = baseUrl;
    }

    public void markDestroying() {
        this.status = STATUS_DESTROYING;
    }

    public void markDestroyed() {
        this.status = STATUS_DESTROYED;
        this.destroyedAt = Instant.now();
    }

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    public void extendTtl(int extraHours) {
        this.ttlHours += extraHours;
        this.expiresAt = this.expiresAt.plusSeconds(extraHours * 3600L);
        this.cost += calculateCost(extraHours, this.resourceSize);
    }

    public UUID getId() { return id; }
    public String getTenantId() { return tenantId; }
    public String getProjectId() { return projectId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getRepoId() { return repoId; }
    public String getBranchName() { return branchName; }
    public Integer getPrNumber() { return prNumber; }
    public void setPrNumber(Integer prNumber) { this.prNumber = prNumber; }
    public String getPrUrl() { return prUrl; }
    public void setPrUrl(String prUrl) { this.prUrl = prUrl; }
    public UUID getSourceEnvironmentId() { return sourceEnvironmentId; }
    public String getBaseUrl() { return baseUrl; }
    public String getStatus() { return status; }
    public int getTtlHours() { return ttlHours; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getExpiresAt() { return expiresAt; }
    public Instant getDestroyedAt() { return destroyedAt; }
    public double getCost() { return cost; }
    public String getResourceSize() { return resourceSize; }
    public String getResourceConfig() { return resourceConfig; }
    public void setResourceConfig(String resourceConfig) { this.resourceConfig = resourceConfig; }
}
