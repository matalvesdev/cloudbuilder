package com.cloudbuilder.observe.domain.service;

import com.cloudbuilder.observe.domain.model.Alert;
import com.cloudbuilder.observe.domain.model.ServiceHealth;
import com.cloudbuilder.observe.domain.port.AlertRepository;
import com.cloudbuilder.observe.domain.port.ServiceHealthRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration test for HealthCheckService using Testcontainers PostgreSQL.
 * Covers: record health, auto-alerting, resolve alerts, query history.
 * Disabled by default — requires a running Docker daemon.
 */
@SpringBootTest
@Testcontainers
@Disabled("Requires Docker")
@ActiveProfiles("test")
class ObserveServiceIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("cloudbuilder-test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        registry.add("spring.jpa.properties.hibernate.dialect", () -> "org.hibernate.dialect.PostgreSQLDialect");
        registry.add("spring.flyway.enabled", () -> "false");
        registry.add("spring.modulith.events.jpa.schema-initialization.enabled", () -> "false");
        registry.add("cloudbuilder.security.jwt-secret", () -> "test-secret-key-for-integration-tests-at-least-32-chars!");
    }

    @Autowired
    private HealthCheckService healthCheckService;

    @Autowired
    private ServiceHealthRepository serviceHealthRepository;

    @Autowired
    private AlertRepository alertRepository;

    @AfterEach
    void cleanup() {
        alertRepository.deleteAll();
        serviceHealthRepository.deleteAll();
    }

    @Test
    @DisplayName("Deve registrar health check e recuperar por environment")
    void testRecordAndGetHealth() {
        String envId = "env-observe-test";

        ServiceHealth h1 = healthCheckService.recordHealth("api-gateway", envId, "healthy", 45.0, 99.9);
        ServiceHealth h2 = healthCheckService.recordHealth("database", envId, "healthy", 12.0, 99.99);

        assertNotNull(h1.getId());
        assertNotNull(h2.getId());
        assertEquals("api-gateway", h1.getServiceName());
        assertEquals("healthy", h1.getStatus());

        List<ServiceHealth> healthList = healthCheckService.getServiceHealth(envId);
        assertEquals(2, healthList.size());
    }

    @Test
    @DisplayName("Deve criar alerta automaticamente quando status é degraded")
    void testAutoAlertOnDegraded() {
        String envId = "env-degraded-test";

        ServiceHealth health = healthCheckService.recordHealth("web-app", envId, "degraded", 500.0, 95.0);
        assertNotNull(health.getId());

        // Should auto-create a warning alert
        List<Alert> alerts = healthCheckService.getActiveAlerts(envId);
        assertEquals(1, alerts.size());
        assertEquals("warning", alerts.getFirst().getSeverity());
        assertTrue(alerts.getFirst().getMessage().contains("degraded"));
        assertEquals("OPEN", alerts.getFirst().getStatus());
    }

    @Test
    @DisplayName("Deve criar alerta critical quando status é down")
    void testAutoAlertOnDown() {
        String envId = "env-down-test";

        healthCheckService.recordHealth("payment-service", envId, "down", 0, 0);

        List<Alert> alerts = healthCheckService.getActiveAlerts(envId);
        assertEquals(1, alerts.size());
        assertEquals("critical", alerts.getFirst().getSeverity());
    }

    @Test
    @DisplayName("NÃO deve criar alerta quando status é healthy")
    void testNoAlertOnHealthy() {
        String envId = "env-healthy-test";

        healthCheckService.recordHealth("auth-service", envId, "healthy", 20.0, 99.99);

        List<Alert> alerts = healthCheckService.getActiveAlerts(envId);
        assertEquals(0, alerts.size());
    }

    @Test
    @DisplayName("Deve resolver alerta")
    void testResolveAlert() {
        String envId = "env-resolve-test";

        healthCheckService.recordHealth("cache", envId, "down", 0, 0);

        List<Alert> openAlerts = healthCheckService.getOpenAlerts();
        assertFalse(openAlerts.isEmpty());

        Alert resolved = healthCheckService.resolveAlert(openAlerts.getFirst().getId());
        assertEquals("RESOLVED", resolved.getStatus());
        assertNotNull(resolved.getResolvedAt());

        // After resolving, no more open alerts
        List<Alert> stillOpen = healthCheckService.getOpenAlerts();
        assertEquals(0, stillOpen.size());
    }

    @Test
    @DisplayName("Deve recuperar latest health por service name")
    void testGetLatestHealth() {
        String envId = "env-latest-test";

        healthCheckService.recordHealth("api", envId, "healthy", 30.0, 99.9);
        healthCheckService.recordHealth("api", envId, "degraded", 200.0, 98.0);

        var latest = healthCheckService.getLatestHealth("api", envId);
        assertTrue(latest.isPresent());
        assertEquals("degraded", latest.get().getStatus());
    }

    @Test
    @DisplayName("Deve isolar alerts por environment")
    void testAlertIsolation() {
        String envA = "env-isolation-a";
        String envB = "env-isolation-b";

        healthCheckService.recordHealth("svc", envA, "down", 0, 0);
        healthCheckService.recordHealth("svc", envB, "degraded", 300.0, 90.0);

        List<Alert> alertsA = healthCheckService.getActiveAlerts(envA);
        List<Alert> alertsB = healthCheckService.getActiveAlerts(envB);

        assertEquals(1, alertsA.size());
        assertEquals(1, alertsB.size());
        assertEquals("critical", alertsA.getFirst().getSeverity());
        assertEquals("warning", alertsB.getFirst().getSeverity());
    }
}
