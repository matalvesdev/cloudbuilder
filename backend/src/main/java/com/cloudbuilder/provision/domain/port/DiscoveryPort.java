package com.cloudbuilder.provision.domain.port;

import java.util.List;
import java.util.Map;

/**
 * Port for cloud resource discovery operations.
 * Implemented by discovery adapter in infrastructure layer.
 */
public interface DiscoveryPort {
    /** Discover resources from a provider. */
    List<Map<String, String>> discoverResources(String providerType, Map<String, String> credentials);

    /** Discover available regions for a provider. */
    List<String> discoverRegions(String providerType, Map<String, String> credentials);

    /** Discover available services for a provider. */
    List<String> discoverServices(String providerType, Map<String, String> credentials);
}
