package com.cloudbuilder.shared.event.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class TopicRouterTest {

    private TopicRouter router;

    @BeforeEach
    void setUp() {
        router = new TopicRouter(
            "cost.events",
            "deployment.events",
            "observability.events",
            "ai.events",
            "canvas.events",
            "provisioning.events",
            "security.events",
            "identity.events",
            "audit.events",
            "policy.events",
            "notification.events",
            "system.events"
        );
    }

    @Test
    void resolveTopic_CostAnomaly() {
        assertEquals("cost.events", router.resolveTopic("cost.anomaly"));
    }

    @Test
    void resolveTopic_CostOptimization() {
        assertEquals("cost.events", router.resolveTopic("cost.optimization.applied"));
    }

    @Test
    void resolveTopic_DeploymentStarted() {
        assertEquals("deployment.events", router.resolveTopic("deployment.started"));
    }

    @Test
    void resolveTopic_DeploymentCompleted() {
        assertEquals("deployment.events", router.resolveTopic("deployment.completed"));
    }

    @Test
    void resolveTopic_DriftDetected() {
        assertEquals("observability.events", router.resolveTopic("drift.detected"));
    }

    @Test
    void resolveTopic_HealthCheck() {
        assertEquals("observability.events", router.resolveTopic("health.check"));
    }

    @Test
    void resolveTopic_IncidentCreated() {
        assertEquals("ai.events", router.resolveTopic("incident.created"));
    }

    @Test
    void resolveTopic_AiopsAnalysis() {
        assertEquals("ai.events", router.resolveTopic("aiops.analysis.complete"));
    }

    @Test
    void resolveTopic_CanvasCreated() {
        assertEquals("canvas.events", router.resolveTopic("canvas.created"));
    }

    @Test
    void resolveTopic_TerraformPlan() {
        assertEquals("canvas.events", router.resolveTopic("terraform.plan.complete"));
    }

    @Test
    void resolveTopic_SecurityScan() {
        assertEquals("security.events", router.resolveTopic("security.scan.complete"));
    }

    @Test
    void resolveTopic_IdentityUserCreated() {
        assertEquals("identity.events", router.resolveTopic("user.created"));
    }

    @Test
    void resolveTopic_AuditLogged() {
        assertEquals("audit.events", router.resolveTopic("audit.event.logged"));
    }

    @Test
    void resolveTopic_PolicyViolation() {
        assertEquals("policy.events", router.resolveTopic("policy.violation.detected"));
    }

    @Test
    void resolveTopic_NotificationSent() {
        assertEquals("notification.events", router.resolveTopic("notification.sent"));
    }

    @Test
    void resolveTopic_NullEventType() {
        assertEquals("system.events", router.resolveTopic(null));
    }

    @Test
    void resolveTopic_BlankEventType() {
        assertEquals("system.events", router.resolveTopic(""));
    }

    @Test
    void resolveTopic_UnknownPrefix() {
        assertEquals("system.events", router.resolveTopic("unknown.event"));
    }

    @Test
    void resolveTopic_SingleSegmentEventType() {
        assertEquals("cost.events", router.resolveTopic("cost"));
    }
}
