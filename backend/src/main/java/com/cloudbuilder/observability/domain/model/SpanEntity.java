package com.cloudbuilder.observability.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
@Entity
@Table(name = "spans")
public class SpanEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "trace_id", nullable = false, length = 32)
    private String traceId;

    @Column(name = "span_id", nullable = false, length = 16)
    private String spanId;

    @Column(name = "parent_span_id", length = 16)
    private String parentSpanId;

    @Column(name = "tenant_id", nullable = false, length = 64)
    private String tenantId;

    @Column(name = "service_name", nullable = false, length = 128)
    private String serviceName;

    @Column(nullable = false, length = 256)
    private String operation;

    @Column(name = "start_time", nullable = false)
    private Instant startTime;

    @Column(name = "duration_ms", nullable = false)
    private int durationMs;

    @Column(name = "status_code")
    private Integer statusCode;

    @Column(length = 16)
    private String status;

    @Column(columnDefinition = "TEXT DEFAULT '{}'")
    private String tags;

    public SpanEntity() {}

    public SpanEntity(String traceId, String spanId, String parentSpanId, String tenantId,
                      String serviceName, String operation, Instant startTime, int durationMs,
                      Integer statusCode, String status, String tags) {
        this.traceId = traceId;
        this.spanId = spanId;
        this.parentSpanId = parentSpanId;
        this.tenantId = tenantId;
        this.serviceName = serviceName;
        this.operation = operation;
        this.startTime = startTime;
        this.durationMs = durationMs;
        this.statusCode = statusCode;
        this.status = status;
        this.tags = tags;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTraceId() { return traceId; }
    public void setTraceId(String traceId) { this.traceId = traceId; }
    public String getSpanId() { return spanId; }
    public void setSpanId(String spanId) { this.spanId = spanId; }
    public String getParentSpanId() { return parentSpanId; }
    public void setParentSpanId(String parentSpanId) { this.parentSpanId = parentSpanId; }
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }
    public String getOperation() { return operation; }
    public void setOperation(String operation) { this.operation = operation; }
    public Instant getStartTime() { return startTime; }
    public void setStartTime(Instant startTime) { this.startTime = startTime; }
    public int getDurationMs() { return durationMs; }
    public void setDurationMs(int durationMs) { this.durationMs = durationMs; }
    public Integer getStatusCode() { return statusCode; }
    public void setStatusCode(Integer statusCode) { this.statusCode = statusCode; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }
}
