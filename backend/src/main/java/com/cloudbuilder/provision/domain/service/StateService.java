package com.cloudbuilder.provision.domain.service;

import com.cloudbuilder.provision.domain.model.ManagedResource;
import com.cloudbuilder.provision.domain.port.EnvironmentRepository;
import com.cloudbuilder.provision.domain.port.ManagedResourceRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
@Service
@Transactional
public class StateService {

    private final ManagedResourceRepository managedResourceRepository;
    private final EnvironmentRepository environmentRepository;
    private final ObjectMapper objectMapper;

    public StateService(ManagedResourceRepository managedResourceRepository,
                        EnvironmentRepository environmentRepository,
                        ObjectMapper objectMapper) {
        this.managedResourceRepository = managedResourceRepository;
        this.environmentRepository = environmentRepository;
        this.objectMapper = objectMapper;
    }

    public ManagedResource recordResource(String environmentId, String terraformAddress,
                                          String resourceType, String provider,
                                          String properties) {
        var environment = environmentRepository.findById(environmentId)
            .orElseThrow(() -> new IllegalArgumentException("Environment not found: " + environmentId));

        ManagedResource resource = new ManagedResource(
            environmentId, terraformAddress, resourceType, provider, environment.getRegion(), properties
        );
        return managedResourceRepository.save(resource);
    }

    public ManagedResource updateResourceStatus(String resourceId, String status) {
        ManagedResource resource = managedResourceRepository.findById(resourceId)
            .orElseThrow(() -> new IllegalArgumentException("Resource not found: " + resourceId));
        resource.setStatus(status);
        return managedResourceRepository.save(resource);
    }

    public ManagedResource updateResourceState(String resourceId, String stateJson) {
        ManagedResource resource = managedResourceRepository.findById(resourceId)
            .orElseThrow(() -> new IllegalArgumentException("Resource not found: " + resourceId));
        resource.setStateJson(stateJson);
        resource.setStatus(ManagedResource.STATUS_ACTIVE);
        return managedResourceRepository.save(resource);
    }

    @Transactional(readOnly = true)
    public List<ManagedResource> getResourcesByEnvironment(String environmentId) {
        return managedResourceRepository.findByEnvironmentId(environmentId);
    }

    @Transactional(readOnly = true)
    public ManagedResource getResourceByAddress(String address) {
        return managedResourceRepository.findByTerraformAddress(address)
            .orElseThrow(() -> new IllegalArgumentException("Resource not found: " + address));
    }

    public List<ManagedResource> syncResourcesFromState(String environmentId, String stateJson) {
        var environment = environmentRepository.findById(environmentId)
            .orElseThrow(() -> new IllegalArgumentException("Environment not found: " + environmentId));

        List<ManagedResource> synced = new ArrayList<>();

        try {
            JsonNode root = objectMapper.readTree(stateJson);
            JsonNode resources = root.get("resources");
            if (resources == null || !resources.isArray()) {
                return synced;
            }

            for (JsonNode resourceNode : resources) {
                String address = resourceNode.get("address").asText();
                String resourceType = resourceNode.get("type").asText();
                String provider = extractProvider(resourceNode);
                JsonNode instances = resourceNode.get("instances");

                String instanceStateJson = null;
                String[] propertiesRef = {null};

                if (instances != null && instances.isArray() && instances.size() > 0) {
                    JsonNode instance = instances.get(0);
                    instanceStateJson = instance.toString();
                    JsonNode attributes = instance.get("attributes");
                    if (attributes != null) {
                        propertiesRef[0] = attributes.toString();
                    }
                }
                final String props = propertiesRef[0];

                ManagedResource resource = managedResourceRepository
                    .findByTerraformAddress(address)
                    .orElseGet(() -> new ManagedResource(
                        environmentId, address, resourceType, provider,
                        environment.getRegion(), props
                    ));

                resource.setResourceType(resourceType);
                resource.setProvider(provider);
                resource.setRegion(environment.getRegion());
                resource.setStateJson(instanceStateJson);
                if (props != null) {
                    resource.setProperties(props);
                }
                resource.setStatus(ManagedResource.STATUS_ACTIVE);

                synced.add(managedResourceRepository.save(resource));
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse state JSON", e);
        }

        return synced;
    }

    private String extractProvider(JsonNode resourceNode) {
        JsonNode providerNode = resourceNode.get("provider");
        if (providerNode == null) {
            return "unknown";
        }
        String provider = providerNode.asText();
        int lastSlash = provider.lastIndexOf('/');
        if (lastSlash >= 0) {
            provider = provider.substring(lastSlash + 1);
        }
        return provider.replace("]", "").replace("\"", "").trim();
    }
}
