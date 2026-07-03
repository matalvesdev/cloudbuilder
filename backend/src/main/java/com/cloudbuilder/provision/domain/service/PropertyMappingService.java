package com.cloudbuilder.provision.domain.service;

import com.cloudbuilder.provision.domain.port.ProviderAdapter;
import com.cloudbuilder.provision.domain.port.ProviderRegistry;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Maps properties from parsed Terraform resources to CloudBuilder canvas component
 * fields. Delegates to ProviderAdapter implementations via ProviderRegistry.
 */
@Service
public class PropertyMappingService {

    private final ProviderRegistry providerRegistry;

    public PropertyMappingService(ProviderRegistry providerRegistry) {
        this.providerRegistry = providerRegistry;
    }

    public Map<String, String> mapProperties(String resourceType, Map<String, String> rawProperties) {
        Map<String, String> result = new LinkedHashMap<>();

        // Try to find a schema from the provider adapter
        Map<String, String> schema = providerRegistry.findAdapterForResource(resourceType)
                .map(adapter -> adapter.getPropertySchema(resourceType))
                .orElseGet(() -> Map.of("id", "ID"));

        if (!schema.isEmpty()) {
            for (var schemaEntry : schema.entrySet()) {
                String rawKey = schemaEntry.getKey();
                String displayLabel = schemaEntry.getValue();
                String value = rawProperties.get(rawKey);
                if (value != null && !value.isBlank()) {
                    result.put(displayLabel, value);
                }
            }
        }

        // Fallback: include first 5 raw properties
        if (result.isEmpty()) {
            int count = 0;
            for (var entry : rawProperties.entrySet()) {
                if (count >= 5) break;
                result.put(entry.getKey(), entry.getValue());
                count++;
            }
        }

        return result;
    }

    public String getComponentId(String resourceType) {
        return providerRegistry.findAdapterForResource(resourceType)
                .map(adapter -> adapter.mapToComponentId(resourceType))
                .orElse(resourceType);
    }
}
