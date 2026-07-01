package com.cloudbuilder.provision.domain.service;

import com.cloudbuilder.provision.domain.model.DriftReport;
import com.cloudbuilder.provision.domain.model.ManagedResource;
import com.cloudbuilder.provision.domain.port.DriftReportRepository;
import com.cloudbuilder.provision.domain.port.ManagedResourceRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration test for DriftDetectionService using Testcontainers PostgreSQL.
 * Covers: drift detection, drift resolution, drift history.
 * Disabled by default — requires a running Docker daemon.
 */
@SpringBootTest
@Testcontainers
@Disabled("Requires Docker")
@ActiveProfiles("test")
class DriftDetectionServiceIntegrationTest {

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
    private DriftDetectionService driftDetectionService;

    @Autowired
    private ManagedResourceRepository managedResourceRepository;

    @Autowired
    private DriftReportRepository driftReportRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @AfterEach
    void cleanup() {
        driftReportRepository.deleteAll();
        managedResourceRepository.deleteAll();
    }

    @Test
    @DisplayName("Deve detectar drift quando recurso foi removido do state")
    void testDetectDriftRemovedResource() {
        String envId = "env-drift-test";

        // Register a resource in DB
        ManagedResource resource = managedResourceRepository.save(
                new ManagedResource(envId, "aws_instance.web", "aws_instance", "aws", "us-east-1",
                        "{\"instance_type\":\"t3.micro\"}"));
        resource.setStatus(ManagedResource.STATUS_ACTIVE);
        managedResourceRepository.save(resource);

        // State with NO resources (resource was deleted from infrastructure)
        String stateJson = "{\"resources\":[]}";

        DriftReport report = driftDetectionService.detectDrift(envId, stateJson);
        assertNotNull(report.getId());
        assertEquals(envId, report.getEnvironmentId());
        assertEquals("OPEN", report.getStatus());
        assertNotNull(report.getDriftDetails());
        assertTrue(report.getDriftDetails().contains("aws_instance.web"));
    }

    @Test
    @DisplayName("Deve detectar drift quando propriedade foi modificada")
    void testDetectDriftModifiedProperty() {
        String envId = "env-drift-mod-test";

        ManagedResource resource = managedResourceRepository.save(
                new ManagedResource(envId, "aws_instance.api", "aws_instance", "aws", "us-east-1",
                        "{\"instance_type\":\"t3.micro\",\"ami\":\"ami-12345\"}"));
        resource.setStatus(ManagedResource.STATUS_ACTIVE);
        managedResourceRepository.save(resource);

        // State has different instance_type
        String stateJson = """
                {
                  "resources": [
                    {
                      "address": "aws_instance.api",
                      "instances": [
                        {
                          "attributes": {
                            "instance_type": "t3.large",
                            "ami": "ami-12345"
                          }
                        }
                      ]
                    }
                  ]
                }""";

        DriftReport report = driftDetectionService.detectDrift(envId, stateJson);
        assertNotNull(report.getId());
        assertEquals("OPEN", report.getStatus());
        assertTrue(report.getDriftDetails().contains("instance_type"));
    }

    @Test
    @DisplayName("Deve retornar sem drift quando state coincide com DB")
    void testNoDrift() {
        String envId = "env-no-drift-test";

        ManagedResource resource = managedResourceRepository.save(
                new ManagedResource(envId, "aws_s3.bucket", "aws_s3", "aws", "us-east-1",
                        "{\"bucket_name\":\"my-bucket\"}"));
        resource.setStatus(ManagedResource.STATUS_ACTIVE);
        managedResourceRepository.save(resource);

        String stateJson = """
                {
                  "resources": [
                    {
                      "address": "aws_s3.bucket",
                      "instances": [
                        {
                          "attributes": {
                            "bucket_name": "my-bucket"
                          }
                        }
                      ]
                    }
                  ]
                }""";

        DriftReport report = driftDetectionService.detectDrift(envId, stateJson);
        assertNotNull(report.getId());
        // Drift details should be empty or not contain drifts
        assertTrue(report.getDriftDetails().contains("[]") || report.getDriftDetails().length() < 10,
                "No drift expected when state matches DB");
    }

    @Test
    @DisplayName("Deve resolver drift report")
    void testResolveDrift() {
        String envId = "env-resolve-drift-test";

        DriftReport report = driftReportRepository.save(new DriftReport(envId, "[{\"address\":\"test\"}]"));
        assertEquals("OPEN", report.getStatus());

        DriftReport resolved = driftDetectionService.resolveDrift(report.getId(), "admin@test.com");
        assertEquals("RESOLVED", resolved.getStatus());
        assertEquals("admin@test.com", resolved.getResolvedBy());
        assertNotNull(resolved.getResolvedAt());
    }

    @Test
    @DisplayName("Deve manter histórico de drift reports")
    void testDriftHistory() {
        String envId = "env-history-test";

        driftReportRepository.save(new DriftReport(envId, "[{\"address\":\"r1\"}]"));
        driftReportRepository.save(new DriftReport(envId, "[{\"address\":\"r2\"}]"));
        driftReportRepository.save(new DriftReport(envId, "[{\"address\":\"r3\"}]"));

        List<DriftReport> history = driftDetectionService.getDriftHistory(envId);
        assertEquals(3, history.size());
    }

    @Test
    @DisplayName("Deve isolar drift reports por environment")
    void testDriftIsolation() {
        String envA = "env-drift-iso-a";
        String envB = "env-drift-iso-b";

        driftReportRepository.save(new DriftReport(envA, "[{\"address\":\"a1\"}]"));
        driftReportRepository.save(new DriftReport(envA, "[{\"address\":\"a2\"}]"));
        driftReportRepository.save(new DriftReport(envB, "[{\"address\":\"b1\"}]"));

        List<DriftReport> historyA = driftDetectionService.getDriftHistory(envA);
        List<DriftReport> historyB = driftDetectionService.getDriftHistory(envB);

        assertEquals(2, historyA.size());
        assertEquals(1, historyB.size());
    }

    @Test
    @DisplayName("Deve retornar latest drift report")
    void testGetLatestDrift() {
        String envId = "env-latest-drift-test";

        driftReportRepository.save(new DriftReport(envId, "[{\"address\":\"old\"}]"));
        driftReportRepository.save(new DriftReport(envId, "[{\"address\":\"new\"}]"));

        Optional<DriftReport> latest = driftDetectionService.getLatestDrift(envId);
        assertTrue(latest.isPresent());
        assertTrue(latest.get().getDriftDetails().contains("new"));
    }
}
