package com.cloudbuilder.platform.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "marketplace_listings")
public class MarketplaceListing {

    public static final String STATUS_DRAFT = "DRAFT";
    public static final String STATUS_PUBLISHED = "PUBLISHED";
    public static final String STATUS_UNPUBLISHED = "UNPUBLISHED";

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "cloud_provider", nullable = false)
    private String cloudProvider;

    @Column(name = "marketplace_url")
    private String marketplaceUrl;

    @Column(name = "listing_type", nullable = false)
    private String listingType;

    @Column(nullable = false)
    private String version;

    @Column(nullable = false)
    private String status;

    @Column(name = "publisher_name")
    private String publisherName;

    @Column(columnDefinition = "TEXT")
    private String tags;

    @Column(columnDefinition = "TEXT")
    private String pricing;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected MarketplaceListing() {}

    public MarketplaceListing(String name, String description, String cloudProvider,
                              String listingType, String version, String publisherName) {
        this.id = UUID.randomUUID().toString();
        this.name = name;
        this.description = description;
        this.cloudProvider = cloudProvider;
        this.listingType = listingType;
        this.version = version;
        this.publisherName = publisherName;
        this.status = STATUS_DRAFT;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCloudProvider() { return cloudProvider; }
    public String getMarketplaceUrl() { return marketplaceUrl; }
    public void setMarketplaceUrl(String marketplaceUrl) { this.marketplaceUrl = marketplaceUrl; }
    public String getListingType() { return listingType; }
    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPublisherName() { return publisherName; }
    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }
    public String getPricing() { return pricing; }
    public void setPricing(String pricing) { this.pricing = pricing; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
