package com.cloudbuilder.featureflags.domain.service;

import com.cloudbuilder.featureflags.application.dto.CreateFlagRequest;
import com.cloudbuilder.featureflags.application.dto.FeatureFlagDTO;
import com.cloudbuilder.featureflags.application.dto.UpdateFlagRequest;
import com.cloudbuilder.featureflags.domain.model.FeatureFlag;
import com.cloudbuilder.featureflags.domain.port.FeatureFlagRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for managing feature flags (ADR-032).
 * Resolution: tenant-specific > global > default (false).
 * Flags are cached with 30s TTL via Spring @Cacheable + Caffeine.
 */
@Service
public class FeatureFlagService {

    private final FeatureFlagRepository repository;

    public FeatureFlagService(FeatureFlagRepository repository) {
        this.repository = repository;
    }

    /**
     * Get all flags (global + tenant-specific) with resolved enabled state.
     */
    @Cacheable(value = "featureFlags", key = "#tenantId != null ? #tenantId : 'global'")
    public List<FeatureFlagDTO> getFlags(String tenantId) {
        Map<String, FeatureFlag> globalMap = new HashMap<>();
        for (var flag : repository.findByTenantIdIsNull()) {
            globalMap.put(flag.getFlagKey(), flag);
        }

        Map<String, FeatureFlag> tenantMap = new HashMap<>();
        if (tenantId != null) {
            for (var flag : repository.findByTenantId(tenantId)) {
                tenantMap.put(flag.getFlagKey(), flag);
            }
        }

        // Union of all keys: tenant > global
        Set<String> allKeys = new HashSet<>(globalMap.keySet());
        allKeys.addAll(tenantMap.keySet());

        List<FeatureFlagDTO> result = new ArrayList<>();
        for (String key : allKeys) {
            FeatureFlag tenantFlag = tenantMap.get(key);
            FeatureFlag globalFlag = globalMap.get(key);
            FeatureFlag resolved = tenantFlag != null ? tenantFlag : globalFlag;
            boolean resolvedEnabled = tenantFlag != null ? tenantFlag.isEnabled()
                                    : (globalFlag != null ? globalFlag.isEnabled() : false);
            result.add(FeatureFlagDTO.fromEntity(resolved, tenantFlag != null));
        }

        result.sort(Comparator.comparing(FeatureFlagDTO::getFlagKey));
        return result;
    }

    /**
     * Check if a specific flag is enabled for a tenant.
     * Returns false if no flag exists.
     */
    public boolean isEnabled(String flagKey, String tenantId) {
        if (tenantId != null) {
            var tenantFlag = repository.findByFlagKeyAndTenantId(flagKey, tenantId);
            if (tenantFlag.isPresent()) {
                return tenantFlag.get().isEnabled();
            }
        }
        var globalFlag = repository.findByFlagKeyAndTenantIdIsNull(flagKey);
        return globalFlag.map(FeatureFlag::isEnabled).orElse(false);
    }

    /**
     * Get config_json for a flag, returns empty optional if flag not found.
     */
    public Optional<String> getConfig(String flagKey, String tenantId) {
        if (tenantId != null) {
            var tenantFlag = repository.findByFlagKeyAndTenantId(flagKey, tenantId);
            if (tenantFlag.isPresent()) {
                return Optional.ofNullable(tenantFlag.get().getConfigJson());
            }
        }
        return repository.findByFlagKeyAndTenantIdIsNull(flagKey)
                .map(FeatureFlag::getConfigJson);
    }

    /**
     * Create a new feature flag.
     */
    public FeatureFlagDTO createFlag(CreateFlagRequest request) {
        var flag = new FeatureFlag(
            request.flagKey(),
            request.enabled(),
            request.tenantId(),
            request.configJson(),
            request.description()
        );
        var saved = repository.save(flag);
        return FeatureFlagDTO.fromEntity(saved, saved.getTenantId() != null);
    }

    /**
     * Update an existing feature flag.
     */
    public Optional<FeatureFlagDTO> updateFlag(String id, UpdateFlagRequest request) {
        return repository.findById(id).map(flag -> {
            if (request.enabled() != null) {
                flag.setEnabled(request.enabled());
            }
            if (request.configJson() != null) {
                flag.setConfigJson(request.configJson());
            }
            if (request.description() != null) {
                flag.setDescription(request.description());
            }
            var saved = repository.save(flag);
            return FeatureFlagDTO.fromEntity(saved, saved.getTenantId() != null);
        });
    }

    /**
     * Delete a feature flag.
     */
    public boolean deleteFlag(String id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return true;
        }
        return false;
    }

    /**
     * Evict all feature flag caches (called after admin changes).
     */
    @CacheEvict(value = "featureFlags", allEntries = true)
    public void refreshCache() {
        // Cache evicted via annotation
    }
}
