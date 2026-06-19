package com.cloudbuilder.multiregion.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "regions")
public class Region {

    @Id
    private String id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String provider;

    @Column(nullable = false)
    private String country;

    @Column(nullable = false)
    private boolean isPrimary;

    @Column(nullable = false)
    private boolean isActive;

    @Column(columnDefinition = "TEXT")
    private String metadata;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected Region() {}

    public Region(String code, String name, String provider, String country, boolean isPrimary) {
        this.id = UUID.randomUUID().toString();
        this.code = code;
        this.name = name;
        this.provider = provider;
        this.country = country;
        this.isPrimary = isPrimary;
        this.isActive = true;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; this.updatedAt = Instant.now(); }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; this.updatedAt = Instant.now(); }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; this.updatedAt = Instant.now(); }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; this.updatedAt = Instant.now(); }
    public boolean isPrimary() { return isPrimary; }
    public void setPrimary(boolean primary) { isPrimary = primary; this.updatedAt = Instant.now(); }
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; this.updatedAt = Instant.now(); }
    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; this.updatedAt = Instant.now(); }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}