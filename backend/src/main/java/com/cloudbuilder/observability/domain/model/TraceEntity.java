package com.cloudbuilder.observability.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
@Entity
@Table(name = "traces")
public class TraceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "trace_id", nullable = false, length = 32)
    private String traceId;

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

    @Column(name = "status_code", nullable = false)
    private int statusCode;

    @Column(name = "is_error")
    private boolean isError;

    @Column(columnDefinition = "JSONB DEFAULT '{}'")
    private String metadata;

    public TraceEntity() {}

    public TraceEntity(String traceId, String tenantId, String serviceName, String operation,
                       Instant startTime, int durationMs, int statusCode, boolean isError, String metadata) {
        this.traceId = traceId;
        this.tenantId = tenantId;
        this.serviceName = serviceName;
        this.operation = operation;
        this.startTime = startTime;
        this.durationMs = durationMs;
        this.statusCode = statusCode;
        this.isError = isError;
        this.metadata = metadata;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTraceId() { return traceId; }
    public void setTraceId(String traceId) { this.traceId = traceId; }
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
    public int getStatusCode() { return statusCode; }
    public void setStatusCode(int statusCode) { this.statusCode = statusCode; }
    public boolean isError() { return isError; }
    public void setError(boolean error) { isError = error; }
    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }
}
