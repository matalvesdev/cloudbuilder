package com.cloudbuilder.shared.monitoring;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Component;

/**
 * Custom Micrometer metrics for CloudBuilder domain operations.
 *
 * These counters and timers are exposed at /actuator/prometheus
 * and consumed by Grafana dashboards (cloudbuilder-overview, cloudbuilder-provision).
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

    public CustomMetrics(MeterRegistry registry) {
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

    public void recordCanvasCreated() { canvasCreated.increment(); }
    public void recordCanvasDeleted() { canvasDeleted.increment(); }
    public void recordNodeAdded() { nodeAdded.increment(); }
    public void recordEdgeAdded() { edgeAdded.increment(); }
    public void recordCodeGenerated() { codeGenerated.increment(); }
    public void recordDeployStarted() { deployStarted.increment(); }
    public void recordDeploySuccess() { deploySuccess.increment(); }
    public void recordDeployFailed() { deployFailed.increment(); }
    public void recordDriftDetected() { driftDetected.increment(); }

    public Timer.Sample startDeployTimer() {
        return Timer.start();
    }

    public void stopDeployTimer(Timer.Sample sample) {
        sample.stop(deployDuration);
    }
}
