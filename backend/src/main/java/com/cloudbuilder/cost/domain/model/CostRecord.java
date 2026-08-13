package com.cloudbuilder.cost.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "cost_records")
public class CostRecord {

    @Id
    private String id;

    @Column(nullable = false)
    private String environmentId;

    @Column(nullable = false)
    private String provider;

    @Column(nullable = false)
    private String serviceName;

    @Column(nullable = false)
    private double amount;

    @Column(nullable = false)
    private String currency;

    @Column(nullable = false)
    private LocalDate date;

    private String resourceId;

    @Column(columnDefinition = "TEXT")
    private String tags;

    @Column(nullable = false, updatable = false)
    private Instant importedAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        if (this.importedAt == null) {
            this.importedAt = Instant.now();
        }
    }

    protected CostRecord() {}

    public CostRecord(String environmentId, String provider, String serviceName,
                      double amount, String currency, LocalDate date) {
        this.id = UUID.randomUUID().toString();
        this.environmentId = environmentId;
        this.provider = provider;
        this.serviceName = serviceName;
        this.amount = amount;
        this.currency = currency;
        this.date = date;
        this.importedAt = Instant.now();
    }

    public String getId() { return id; }
    public String getEnvironmentId() { return environmentId; }
    public String getProvider() { return provider; }
    public String getServiceName() { return serviceName; }
    public double getAmount() { return amount; }
    public String getCurrency() { return currency; }
    public LocalDate getDate() { return date; }
    public String getResourceId() { return resourceId; }
    public void setResourceId(String resourceId) { this.resourceId = resourceId; }
    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }
    public Instant getImportedAt() { return importedAt; }
}
