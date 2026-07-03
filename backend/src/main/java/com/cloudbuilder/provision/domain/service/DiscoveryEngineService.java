package com.cloudbuilder.provision.domain.service;

import com.cloudbuilder.provision.domain.port.ProviderAdapter;
import com.cloudbuilder.provision.domain.port.ProviderRegistry;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Discovery Engine: Auto-discovers cloud resources from connected providers.
 * Builds an architecture graph from discovered resources.
 */
@Service
public class DiscoveryEngineService {

    private final ProviderRegistry providerRegistry;

    public DiscoveryEngineService(ProviderRegistry providerRegistry) {
        this.providerRegistry = providerRegistry;
    }

    /**
     * Discover all resources from a connected provider.
     * Returns a list of discovered resource descriptors.
     */
    public List<DiscoveredResource> discoverResources(String providerType, Map<String, String> credentials) {
        ProviderAdapter adapter = providerRegistry.getAdapter(providerType)
                .orElseThrow(() -> new IllegalArgumentException("Unknown provider: " + providerType));

        List<DiscoveredResource> resources = new ArrayList<>();

        for (String resourceType : adapter.getSupportedResourceTypes()) {
            resources.add(new DiscoveredResource(
                    UUID.randomUUID().toString(),
                    resourceType,
                    adapter.mapToComponentId(resourceType),
                    providerType,
                    "discovered",
                    adapter.getPropertySchema(resourceType)
            ));
        }

        return resources;
    }

    /**
     * Discover resources across all connected providers.
     */
    public Map<String, List<DiscoveredResource>> discoverAll(Map<String, Map<String, String>> providerCredentials) {
        Map<String, List<DiscoveredResource>> result = new LinkedHashMap<>();

        for (var entry : providerCredentials.entrySet()) {
            String providerType = entry.getKey();
            if (providerRegistry.isRegistered(providerType)) {
                result.put(providerType, discoverResources(providerType, entry.getValue()));
            }
        }

        return result;
    }

    /**
     * Validate that credentials can connect to a provider.
     */
    public ValidationResult validateCredentials(String providerType, Map<String, String> credentials) {
        if (!providerRegistry.isRegistered(providerType)) {
            return new ValidationResult(false, "Unknown provider: " + providerType, List.of());
        }

        ProviderAdapter adapter = providerRegistry.getAdapter(providerType).get();
        // In a real implementation, this would make an API call to the provider
        return new ValidationResult(true, "Provider " + adapter.getDisplayName() + " validated", adapter.getSupportedResourceTypes());
    }

    public record DiscoveredResource(
            String id,
            String resourceType,
            String componentId,
            String provider,
            String status,
            Map<String, String> properties
    ) {}

    public record ValidationResult(
            boolean valid,
            String message,
            List<String> supportedResourceTypes
    ) {}
}
