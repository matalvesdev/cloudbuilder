package com.cloudbuilder.multiregion.domain.service;

import com.cloudbuilder.multiregion.domain.model.ReplicationConfig;
import com.cloudbuilder.multiregion.domain.model.Region;
import com.cloudbuilder.multiregion.domain.port.ReplicationConfigRepository;
import com.cloudbuilder.multiregion.domain.port.RegionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Service for managing cross-region replication configurations.
 * Supports creating, monitoring, and troubleshooting replication between regions.
 */
@Service
@Transactional
public class ReplicationService {

    private static final Logger log = LoggerFactory.getLogger(ReplicationService.class);

    private final ReplicationConfigRepository replicationConfigRepository;
    private final RegionRepository regionRepository;

    public ReplicationService(ReplicationConfigRepository replicationConfigRepository,
                              RegionRepository regionRepository) {
        this.replicationConfigRepository = replicationConfigRepository;
        this.regionRepository = regionRepository;
    }

    public ReplicationConfig createConfig(String tenantId, String planId, String sourceRegionId,
                                           String targetRegionId, String resourceType, String strategy) {
        if (sourceRegionId.equals(targetRegionId)) {
            throw new IllegalArgumentException("Source and target regions must be different");
        }

        Region source = regionRepository.findById(sourceRegionId)
                .orElseThrow(() -> new IllegalArgumentException("Source region not found: " + sourceRegionId));
        Region target = regionRepository.findById(targetRegionId)
                .orElseThrow(() -> new IllegalArgumentException("Target region not found: " + targetRegionId));

        if (!List.of("SYNCHRONOUS", "ASYNCHRONOUS", "SNAPSHOT", "STREAMING").contains(strategy.toUpperCase())) {
            throw new IllegalArgumentException("Invalid replication strategy: " + strategy);
        }

        var config = new ReplicationConfig(tenantId, planId, sourceRegionId, targetRegionId,
                resourceType, strategy.toUpperCase());
        return replicationConfigRepository.save(config);
    }

    @Transactional(readOnly = true)
    public Optional<ReplicationConfig> getConfig(String id) {
        return replicationConfigRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<ReplicationConfig> getConfigsByPlan(String planId) {
        return replicationConfigRepository.findByPlanId(planId);
    }

    @Transactional(readOnly = true)
    public List<ReplicationConfig> getConfigsByTenant(String tenantId) {
        return replicationConfigRepository.findByTenantId(tenantId);
    }

    @Transactional(readOnly = true)
    public List<ReplicationConfig> getConfigsByStatus(String status) {
        return replicationConfigRepository.findByStatus(status);
    }

    /**
     * Trigger a synchronization for a replication config.
     * In a real implementation, this would initiate the actual data replication.
     */
    public ReplicationConfig triggerSync(String configId) {
        var config = replicationConfigRepository.findById(configId)
                .orElseThrow(() -> new IllegalArgumentException("Replication config not found: " + configId));

        config.setStatus(ReplicationConfig.Status.SYNCING.name());
        replicationConfigRepository.save(config);

        try {
            long startTime = System.currentTimeMillis();
            simulateSync(config);
            long duration = System.currentTimeMillis() - startTime;

            config.setLastSyncAt(Instant.now());
            config.setLastSyncDurationMs(duration);
            config.setStatus(ReplicationConfig.Status.ACTIVE.name());
            log.info("Replication sync completed for config {} ({}ms)", configId, duration);
        } catch (Exception e) {
            config.setStatus(ReplicationConfig.Status.ERROR.name());
            config.setErrorMessage(e.getMessage());
            log.error("Replication sync failed for config {}: {}", configId, e.getMessage());
        }

        return replicationConfigRepository.save(config);
    }

    public ReplicationConfig pauseConfig(String configId) {
        var config = replicationConfigRepository.findById(configId)
                .orElseThrow(() -> new IllegalArgumentException("Replication config not found: " + configId));
        config.setStatus(ReplicationConfig.Status.PAUSED.name());
        return replicationConfigRepository.save(config);
    }

    public ReplicationConfig resumeConfig(String configId) {
        var config = replicationConfigRepository.findById(configId)
                .orElseThrow(() -> new IllegalArgumentException("Replication config not found: " + configId));
        config.setStatus(ReplicationConfig.Status.ACTIVE.name());
        return replicationConfigRepository.save(config);
    }

    public void deleteConfig(String configId) {
        if (!replicationConfigRepository.existsById(configId)) {
            throw new IllegalArgumentException("Replication config not found: " + configId);
        }
        replicationConfigRepository.deleteById(configId);
    }

    @Transactional(readOnly = true)
    public ReplicationConfigStatusDto getReplicationStatus(String configId) {
        var config = replicationConfigRepository.findById(configId)
                .orElseThrow(() -> new IllegalArgumentException("Replication config not found: " + configId));

        return new ReplicationConfigStatusDto(
                config.getId(),
                config.getSourceRegionId(),
                config.getTargetRegionId(),
                config.getResourceType(),
                config.getStrategy(),
                config.getStatus(),
                config.getLastSyncAt(),
                config.getLastSyncDurationMs(),
                config.getBytesReplicated(),
                config.getRpoMinutes(),
                config.getErrorMessage()
        );
    }

    private void simulateSync(ReplicationConfig config) {
        // Simulate replication with slight delay
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Sync interrupted", e);
        }
        config.setBytesReplicated(config.getBytesReplicated() + 1024 * 1024); // +1MB
    }

    public record ReplicationConfigStatusDto(
            String id,
            String sourceRegionId,
            String targetRegionId,
            String resourceType,
            String strategy,
            String status,
            Instant lastSyncAt,
            long lastSyncDurationMs,
            long bytesReplicated,
            int rpoMinutes,
            String errorMessage
    ) {}
}
