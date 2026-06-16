package com.cloudbuilder.provision.domain.model;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "managed_resources")
public class ManagedResource extends BaseEntity {

    public static final String STATUS_CREATING = "CREATING";
    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_UPDATING = "UPDATING";
    public static final String STATUS_DELETING = "DELETING";
    public static final String STATUS_DELETED = "DELETED";
    public static final String STATUS_ERROR = "ERROR";

    @Column(name = "environment_id", nullable = false)
    private UUID environmentId;

    @Column(name = "node_id")
    private UUID nodeId;

    @Column(name = "terraform_address", nullable = false)
    private String terraformAddress;

    @Column(name = "resource_type", nullable = false)
    private String resourceType;

    @Column(nullable = false)
    private String provider;

    @Column(nullable = false)
    private String region;

    @Column(name = "state_json", columnDefinition = "TEXT")
    private String stateJson;

    @Column(nullable = false)
    private String status;

    @Column(columnDefinition = "TEXT")
    private String properties;

    @Column(columnDefinition = "TEXT")
    private String tags;

    protected ManagedResource() {}

    public ManagedResource(UUID environmentId, String terraformAddress, String resourceType,
                           String provider, String region, String properties) {
        this.environmentId = environmentId;
        this.terraformAddress = terraformAddress;
        this.resourceType = resourceType;
        this.provider = provider;
        this.region = region;
        this.properties = properties;
        this.status = STATUS_CREATING;
    }

    public UUID getEnvironmentId() { return environmentId; }
    public void setEnvironmentId(UUID environmentId) { this.environmentId = environmentId; }
    public UUID getNodeId() { return nodeId; }
    public void setNodeId(UUID nodeId) { this.nodeId = nodeId; }
    public String getTerraformAddress() { return terraformAddress; }
    public void setTerraformAddress(String terraformAddress) { this.terraformAddress = terraformAddress; }
    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }
    public String getStateJson() { return stateJson; }
    public void setStateJson(String stateJson) { this.stateJson = stateJson; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getProperties() { return properties; }
    public void setProperties(String properties) { this.properties = properties; }
    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }
}
