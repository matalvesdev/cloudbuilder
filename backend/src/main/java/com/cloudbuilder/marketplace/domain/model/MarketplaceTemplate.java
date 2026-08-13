package com.cloudbuilder.marketplace.domain.model;

import com.cloudbuilder.shared.kernel.AggregateRoot;
import jakarta.persistence.*;

@Entity
@Table(name = "marketplace_templates")
public class MarketplaceTemplate extends AggregateRoot {

    @Column(nullable = false)
    private String tenantId;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TemplateType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TemplateCategory category;

    @Column(nullable = false)
    private String author;

    @Column(nullable = false)
    private String version;

    @Column(columnDefinition = "TEXT")
    private String configJson;

    @Column(columnDefinition = "TEXT")
    private String resourcesJson;

    @Column(nullable = false)
    private boolean published;

    @Column(nullable = false)
    private int downloads;

    @Column(nullable = false)
    private double rating;

    @Column(nullable = false)
    private int ratingCount;

    @Column(columnDefinition = "TEXT")
    private String tagsJson;

    @Column(columnDefinition = "TEXT")
    private String readmeJson;

    protected MarketplaceTemplate() {}

    public MarketplaceTemplate(String tenantId, String name, String description,
                               TemplateType type, TemplateCategory category,
                               String author, String version) {
        this.tenantId = tenantId;
        this.name = name;
        this.description = description;
        this.type = type;
        this.category = category;
        this.author = author;
        this.version = version;
        this.published = false;
        this.downloads = 0;
        this.rating = 0.0;
        this.ratingCount = 0;
    }

    public void publish() { this.published = true; }
    public void unpublish() { this.published = false; }
    public void incrementDownloads() { this.downloads++; }

    public void addRating(double newRating) {
        double totalRating = this.rating * this.ratingCount + newRating;
        this.ratingCount++;
        this.rating = totalRating / this.ratingCount;
    }

    public String getTenantId() { return tenantId; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public TemplateType getType() { return type; }
    public TemplateCategory getCategory() { return category; }
    public String getAuthor() { return author; }
    public String getTemplateVersion() { return version; }
    public boolean isPublished() { return published; }
    public int getDownloads() { return downloads; }
    public double getRating() { return rating; }
    public int getRatingCount() { return ratingCount; }

    public enum TemplateType {
        BLUEPRINT, MODULE, PLUGIN, AI_AGENT, INFRASTRUCTURE
    }

    public enum TemplateCategory {
        NETWORKING, COMPUTE, STORAGE, DATABASE, SECURITY,
        MONETIZATION, DEVOPS, SERVERLESS, CONTAINER
    }
}
