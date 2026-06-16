package com.cloudbuilder.git.infrastructure;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "git_scan_results")
public class GitScanResultEntity {

    @Id
    private UUID id;

    @Column(name = "repository_id", nullable = false)
    private UUID repositoryId;

    @Column(name = "scanned_at")
    private Instant scannedAt;

    @Column(name = "iac_files", columnDefinition = "TEXT")
    private String iacFiles;

    @Column(name = "app_type")
    private String appType;

    @Column(name = "language")
    private String language;

    @Column(name = "framework")
    private String framework;

    @Column(name = "has_dockerfile")
    private boolean hasDockerfile;

    @Column(name = "has_kubernetes_manifest")
    private boolean hasKubernetesManifest;

    @Column(name = "resource_count")
    private int resourceCount;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @Version
    private Long version;

    protected GitScanResultEntity() {
    }

    public GitScanResultEntity(UUID id, UUID repositoryId, String status) {
        this.id = id;
        this.repositoryId = repositoryId;
        this.status = status;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getRepositoryId() {
        return repositoryId;
    }

    public void setRepositoryId(UUID repositoryId) {
        this.repositoryId = repositoryId;
    }

    public Instant getScannedAt() {
        return scannedAt;
    }

    public void setScannedAt(Instant scannedAt) {
        this.scannedAt = scannedAt;
    }

    public String getIacFiles() {
        return iacFiles;
    }

    public void setIacFiles(String iacFiles) {
        this.iacFiles = iacFiles;
    }

    public String getAppType() {
        return appType;
    }

    public void setAppType(String appType) {
        this.appType = appType;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getFramework() {
        return framework;
    }

    public void setFramework(String framework) {
        this.framework = framework;
    }

    public boolean isHasDockerfile() {
        return hasDockerfile;
    }

    public void setHasDockerfile(boolean hasDockerfile) {
        this.hasDockerfile = hasDockerfile;
    }

    public boolean isHasKubernetesManifest() {
        return hasKubernetesManifest;
    }

    public void setHasKubernetesManifest(boolean hasKubernetesManifest) {
        this.hasKubernetesManifest = hasKubernetesManifest;
    }

    public int getResourceCount() {
        return resourceCount;
    }

    public void setResourceCount(int resourceCount) {
        this.resourceCount = resourceCount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Long getVersion() {
        return version;
    }
}
