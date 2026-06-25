package com.cloudbuilder.platform.domain.model;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Snapshot of a CatalogItem at a specific version.
 * Created automatically whenever a catalog item is updated.
 */
@Entity
@Table(name = "catalog_item_versions")
public class CatalogItemVersion {

    @Id
    private String id;

    @Column(nullable = false)
    private String catalogItemId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String type;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String schema;

    @Column(nullable = false)
    private String version;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected CatalogItemVersion() {}

    public CatalogItemVersion(CatalogItem item) {
        this.id = java.util.UUID.randomUUID().toString();
        this.catalogItemId = item.getId();
        this.name = item.getName();
        this.type = item.getType();
        this.description = item.getDescription();
        this.schema = item.getSchema();
        this.version = item.getVersion();
        this.status = item.getStatus();
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public String getCatalogItemId() { return catalogItemId; }
    public String getName() { return name; }
    public String getType() { return type; }
    public String getDescription() { return description; }
    public String getSchema() { return schema; }
    public String getVersion() { return version; }
    public String getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
}
