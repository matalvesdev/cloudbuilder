package com.cloudbuilder.provision.domain.port;

import java.util.List;
import java.util.Map;

/**
 * SPI (Service Provider Interface) for cloud provider adapters.
 * Each cloud provider (AWS, Azure, GCP, K8s, Vercel, etc.) implements this
 * interface to provide uniform resource management across providers.
 */
public interface ProviderAdapter {

    /** Provider identifier (e.g., "aws", "azure", "gcp", "k8s", "vercel"). */
    String getProviderType();

    /** Human-readable provider name. */
    String getDisplayName();

    /** Supported resource types for this provider. */
    List<String> getSupportedResourceTypes();

    /** Map a Terraform resource type to a canvas component ID. */
    String mapToComponentId(String terraformResourceType);

    /** Get the property schema for a resource type (key → display label). */
    Map<String, String> getPropertySchema(String resourceType);

    /** Validate that a resource type is supported by this provider. */
    boolean supports(String resourceType);

    /** Get the Terraform provider source (e.g., "hashicorp/aws"). */
    String getTerraformProviderSource();

    /** Get the default Terraform provider version constraint. */
    String getTerraformVersionConstraint();
}
