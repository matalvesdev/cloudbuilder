package com.cloudbuilder.shared.monitoring;

import com.cloudbuilder.shared.security.TenantContext;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Custom Micrometer metrics for CloudBuilder domain operations.
 *
 * These counters and timers are exposed at /actuator/prometheus
 * and consumed by Grafana dashboards (cloudbuilder-overview, cloudbuilder-provision).
 *
 * Also writes to PostgreSQL via optional MetricsDualWriter implementations
 * from the observability module (dual-write pattern).
 */
@Component
public class CustomMetrics {

    private final Counter canvasCreated;
    private final Counter canvasDeleted;
    private final Counter nodeAdded;
    private final Counter edgeAdded;
    private final Counter codeGenerated;
    private final Counter deployStarted;
    private final Counter deploySuccess;
    private final Counter deployFailed;
    private final Counter driftDetected;
    private final Timer deployDuration;

    private final List<MetricsDualWriter> dualWriters;

    public CustomMetrics(MeterRegistry registry,
                         @Autowired(required = false) List<MetricsDualWriter> dualWriters) {
        this.dualWriters = dualWriters != null ? dualWriters : Collections.emptyList();
        this.canvasCreated = Counter.builder("cloudbuilder.canvas.created")
                .description("Total canvases created")
                .register(registry);
        this.canvasDeleted = Counter.builder("cloudbuilder.canvas.deleted")
                .description("Total canvases deleted")
                .register(registry);
        this.nodeAdded = Counter.builder("cloudbuilder.canvas.node.added")
                .description("Total nodes added to canvases")
                .register(registry);
        this.edgeAdded = Counter.builder("cloudbuilder.canvas.edge.added")
                .description("Total edges added to canvases")
                .register(registry);
        this.codeGenerated = Counter.builder("cloudbuilder.provision.code.generated")
                .description("Total Terraform/OpenTofu code generations")
                .register(registry);
        this.deployStarted = Counter.builder("cloudbuilder.provision.deploy.started")
                .description("Total deployments started")
                .register(registry);
        this.deploySuccess = Counter.builder("cloudbuilder.provision.deploy.success")
                .description("Total successful deployments")
                .register(registry);
        this.deployFailed = Counter.builder("cloudbuilder.provision.deploy.failed")
                .description("Total failed deployments")
                .register(registry);
        this.driftDetected = Counter.builder("cloudbuilder.provision.drift.detected")
                .description("Total drifts detected")
                .register(registry);
        this.deployDuration = Timer.builder("cloudbuilder.provision.deploy.duration")
                .description("Deployment duration")
                .publishPercentiles(0.5, 0.95, 0.99)
                .register(registry);
    }

    // ── No-arg overloads (backward compatible, use TenantContext) ──

    public void recordCanvasCreated() {
        recordCanvasCreated(TenantContext.getTenantId());
    }

    public void recordCanvasDeleted() {
        recordCanvasDeleted(TenantContext.getTenantId());
    }

    public void recordNodeAdded() {
        recordNodeAdded(TenantContext.getTenantId());
    }

    public void recordEdgeAdded() {
        recordEdgeAdded(TenantContext.getTenantId());
    }

    public void recordCodeGenerated() {
        recordCodeGenerated(TenantContext.getTenantId());
    }

    public void recordDeployStarted() {
        recordDeployStarted(TenantContext.getTenantId());
    }

    public void recordDeploySuccess() {
        recordDeploySuccess(TenantContext.getTenantId());
    }

    public void recordDeployFailed() {
        recordDeployFailed(TenantContext.getTenantId());
    }

    public void recordDriftDetected() {
        recordDriftDetected(TenantContext.getTenantId());
    }

    // ── Tenant-aware methods (used by services with explicit tenant context) ──

    public void recordCanvasCreated(String tenantId) {
        canvasCreated.increment();
        dualWrite("cloudbuilder.canvas.created", tenantId);
    }

    public void recordCanvasDeleted(String tenantId) {
        canvasDeleted.increment();
        dualWrite("cloudbuilder.canvas.deleted", tenantId);
    }

    public void recordNodeAdded(String tenantId) {
        nodeAdded.increment();
        dualWrite("cloudbuilder.canvas.node.added", tenantId);
    }

    public void recordEdgeAdded(String tenantId) {
        edgeAdded.increment();
        dualWrite("cloudbuilder.canvas.edge.added", tenantId);
    }

    public void recordCodeGenerated(String tenantId) {
        codeGenerated.increment();
        dualWrite("cloudbuilder.provision.code.generated", tenantId);
    }

    public void recordDeployStarted(String tenantId) {
        deployStarted.increment();
        dualWrite("cloudbuilder.provision.deploy.started", tenantId);
    }

    public void recordDeploySuccess(String tenantId) {
        deploySuccess.increment();
        dualWrite("cloudbuilder.provision.deploy.success", tenantId);
    }

    public void recordDeployFailed(String tenantId) {
        deployFailed.increment();
        dualWrite("cloudbuilder.provision.deploy.failed", tenantId);
    }

    public void recordDriftDetected(String tenantId) {
        driftDetected.increment();
        dualWrite("cloudbuilder.provision.drift.detected", tenantId);
    }

    public Timer.Sample startDeployTimer() {
        return Timer.start();
    }

    public void stopDeployTimer(Timer.Sample sample) {
        sample.stop(deployDuration);
    }

    private void dualWrite(String metricName, String tenantId) {
        for (MetricsDualWriter writer : dualWriters) {
            writer.recordMetric(metricName, 1.0, tenantId, Collections.emptyMap());
        }
    }
}
