package com.cloudbuilder.provision.domain.port;

import java.util.Map;

/**
 * Port for deployment operations.
 * Implemented by deployment adapter in infrastructure layer.
 */
public interface DeploymentPort {
    /** Deploy application to an environment. */
    String deploy(String environmentId, String version);

    /** Get deployment status. */
    Map<String, Object> getStatus(String deploymentId);

    /** Rollback a deployment. */
    String rollback(String deploymentId);

    /** Get deployment history. */
    java.util.List<Map<String, String>> getHistory(String environmentId);
}
