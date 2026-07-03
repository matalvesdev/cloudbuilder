package com.cloudbuilder.provision.domain.port;

import java.util.Map;

/**
 * Port for infrastructure provisioning operations.
 * Implemented by provision adapter in infrastructure layer.
 */
public interface ProvisionPort {
    /** Generate infrastructure code (Terraform/OpenTofu) from a design. */
    String generateCode(String canvasId, String providerType);

    /** Plan infrastructure changes. */
    Map<String, Object> plan(String environmentId);

    /** Apply infrastructure changes. */
    String apply(String environmentId);

    /** Destroy infrastructure. */
    String destroy(String environmentId);

    /** Get current state. */
    Map<String, Object> getState(String environmentId);
}
