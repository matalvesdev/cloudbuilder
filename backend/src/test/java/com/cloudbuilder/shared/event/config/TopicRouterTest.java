package com.cloudbuilder.shared.event.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class TopicRouterTest {

    private TopicRouter router;

    @BeforeEach
    void setUp() {
        router = new TopicRouter();
    }

    @Test
    void resolveTopic_CostAnomaly() {
        assertEquals("cost.events", router.resolveTopic("cost.anomaly"));
    }

    @Test
    void resolveTopic_DeploymentStarted() {
        assertEquals("deployment.events", router.resolveTopic("deployment.started"));
    }

    @Test
    void resolveTopic_DriftDetected() {
        assertEquals("drift.events", router.resolveTopic("drift.detected"));
    }

    @Test
    void resolveTopic_HealthCheck() {
        assertEquals("health.events", router.resolveTopic("health.check"));
    }

    @Test
    void resolveTopic_IncidentCreated() {
        assertEquals("incident.events", router.resolveTopic("incident.created"));
    }

    @Test
    void resolveTopic_CanvasCreated() {
        assertEquals("canvas.events", router.resolveTopic("canvas.created"));
    }

    @Test
    void resolveTopic_AuditLogged() {
        assertEquals("audit.events", router.resolveTopic("audit.event.logged"));
    }

    @Test
    void resolveTopic_NotificationSent() {
        assertEquals("notification.events", router.resolveTopic("notification.sent"));
    }

    @Test
    void resolveTopic_CredentialEvent() {
        assertEquals("credential.events", router.resolveTopic("credential.updated"));
    }

    @Test
    void resolveTopic_ProvisionEvent() {
        assertEquals("provision.events", router.resolveTopic("provision.started"));
    }

    @Test
    void resolveTopic_NullEventType() {
        assertEquals("platform.events", router.resolveTopic((String) null));
    }

    @Test
    void resolveTopic_BlankEventType() {
        assertEquals("platform.events", router.resolveTopic(""));
    }

    @Test
    void resolveTopic_UnknownPrefix() {
        assertEquals("platform.events", router.resolveTopic("unknown.event"));
    }

    @Test
    void resolveTopic_SingleSegmentEventType() {
        // "cost" does not start with "cost.", so it falls through to default
        assertEquals("platform.events", router.resolveTopic("cost"));
    }

    @Test
    void resolveTopic_EventObject() {
        // Test the PlatformEvent overload
        var event = new com.cloudbuilder.shared.event.PlatformEvent() {
            @Override public String getEventType() { return "cost.anomaly"; }
            @Override public String getTenantId() { return "t1"; }
            @Override public java.time.Instant getTimestamp() { return java.time.Instant.now(); }
        };
        assertEquals("cost.events", router.resolveTopic(event));
    }
}
