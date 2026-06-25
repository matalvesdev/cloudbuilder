package com.cloudbuilder.cost.domain.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "cost_forecasts")
public class CostForecast {

    @Id
    private String id;

    @Column(nullable = false)
    private String tenantId;

    @Column(nullable = false)
    private String environmentId;

    @Column(nullable = false)
    private double predictedAmount;

    private double lowerBound;

    private double upperBound;

    @Column(nullable = false)
    private String period;

    @Column(nullable = false)
    private String model;

    @Column(nullable = false)
    private LocalDateTime forecastDate;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected CostForecast() {}

    public CostForecast(String tenantId, String environmentId, double predictedAmount,
                        double lowerBound, double upperBound, String period, String model,
                        LocalDateTime forecastDate) {
        this.id = UUID.randomUUID().toString();
        this.tenantId = tenantId;
        this.environmentId = environmentId;
        this.predictedAmount = predictedAmount;
        this.lowerBound = lowerBound;
        this.upperBound = upperBound;
        this.period = period;
        this.model = model;
        this.forecastDate = forecastDate;
        this.createdAt = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getEnvironmentId() {
        return environmentId;
    }

    public void setEnvironmentId(String environmentId) {
        this.environmentId = environmentId;
    }

    public double getPredictedAmount() {
        return predictedAmount;
    }

    public void setPredictedAmount(double predictedAmount) {
        this.predictedAmount = predictedAmount;
    }

    public double getLowerBound() {
        return lowerBound;
    }

    public void setLowerBound(double lowerBound) {
        this.lowerBound = lowerBound;
    }

    public double getUpperBound() {
        return upperBound;
    }

    public void setUpperBound(double upperBound) {
        this.upperBound = upperBound;
    }

    public String getPeriod() {
        return period;
    }

    public void setPeriod(String period) {
        this.period = period;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public LocalDateTime getForecastDate() {
        return forecastDate;
    }

    public void setForecastDate(LocalDateTime forecastDate) {
        this.forecastDate = forecastDate;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
