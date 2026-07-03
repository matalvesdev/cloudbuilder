package com.cloudbuilder.provision.domain.port;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Central registry of all provider adapters.
 * Registers adapters via Spring DI and provides lookup by provider type.
 */
@Component
public class ProviderRegistry {

    private final Map<String, ProviderAdapter> adapters = new HashMap<>();

    public ProviderRegistry(List<ProviderAdapter> adapterList) {
        for (ProviderAdapter adapter : adapterList) {
            adapters.put(adapter.getProviderType(), adapter);
        }
    }

    /** Get adapter by provider type (e.g., "aws", "azure"). */
    public Optional<ProviderAdapter> getAdapter(String providerType) {
        return Optional.ofNullable(adapters.get(providerType));
    }

    /** Get all registered adapters. */
    public List<ProviderAdapter> getAllAdapters() {
        return List.copyOf(adapters.values());
    }

    /** Get all supported provider types. */
    public List<String> getSupportedProviders() {
        return List.copyOf(adapters.keySet());
    }

    /** Check if a provider is registered. */
    public boolean isRegistered(String providerType) {
        return adapters.containsKey(providerType);
    }

    /** Find which provider supports a given resource type. */
    public Optional<ProviderAdapter> findAdapterForResource(String resourceType) {
        return adapters.values().stream()
                .filter(a -> a.supports(resourceType))
                .findFirst();
    }

    /** Get a flat map of all resource types across all providers. */
    public Map<String, String> getAllResourceTypeMappings() {
        Map<String, String> mappings = new HashMap<>();
        for (ProviderAdapter adapter : adapters.values()) {
            for (String resourceType : adapter.getSupportedResourceTypes()) {
                mappings.put(resourceType, adapter.mapToComponentId(resourceType));
            }
        }
        return mappings;
    }
}
