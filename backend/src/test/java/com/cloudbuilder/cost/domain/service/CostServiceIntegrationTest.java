package com.cloudbuilder.cost.domain.service;

import com.cloudbuilder.cost.domain.model.Budget;
import com.cloudbuilder.cost.domain.model.CostRecord;
import com.cloudbuilder.cost.domain.port.BudgetRepository;
import com.cloudbuilder.cost.domain.port.CostRecordRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration test for CostService using Testcontainers PostgreSQL.
 * Covers: import cost records, query by date range, budgets, forecasts.
 * Disabled by default — requires a running Docker daemon.
 */
@SpringBootTest
@Testcontainers
@Disabled("Requires Docker")
@ActiveProfiles("test")
class CostServiceIntegrationTest {

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
    private CostService costService;

    @Autowired
    private CostRecordRepository costRecordRepository;

    @Autowired
    private BudgetRepository budgetRepository;

    @AfterEach
    void cleanup() {
        costRecordRepository.deleteAll();
        budgetRepository.deleteAll();
    }

    @Test
    @DisplayName("Deve importar e recuperar cost records por environment")
    void testImportAndQueryCostRecords() {
        String envId = "env-cost-test";

        CostRecord r1 = costService.importCostRecord(
                new CostRecord(envId, "aws", "ec2", 120.50, "USD", LocalDate.of(2026, 6, 1)));
        CostRecord r2 = costService.importCostRecord(
                new CostRecord(envId, "aws", "s3", 45.00, "USD", LocalDate.of(2026, 6, 15)));
        CostRecord r3 = costService.importCostRecord(
                new CostRecord(envId, "aws", "rds", 200.00, "USD", LocalDate.of(2026, 7, 1)));

        assertNotNull(r1.getId());
        assertNotNull(r2.getId());
        assertNotNull(r3.getId());

        // Query all for env
        List<CostRecord> all = costService.getCosts(envId, null, null);
        assertEquals(3, all.size());

        // Query by date range (June only)
        List<CostRecord> june = costService.getCosts(envId,
                LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 30));
        assertEquals(2, june.size());

        // Query by date range (July only)
        List<CostRecord> july = costService.getCosts(envId,
                LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31));
        assertEquals(1, july.size());
        assertEquals("rds", july.getFirst().getServiceName());
    }

    @Test
    @DisplayName("Deve calcular total cost no período")
    void testGetTotalCost() {
        String envId = "env-total-test";

        costService.importCostRecord(
                new CostRecord(envId, "aws", "ec2", 100.00, "USD", LocalDate.of(2026, 6, 1)));
        costService.importCostRecord(
                new CostRecord(envId, "aws", "s3", 50.00, "USD", LocalDate.of(2026, 6, 10)));
        costService.importCostRecord(
                new CostRecord(envId, "aws", "rds", 200.00, "USD", LocalDate.of(2026, 7, 1)));

        double totalJune = costService.getTotalCost(envId,
                LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 30));
        assertEquals(150.00, totalJune, 0.01);

        double totalJuly = costService.getTotalCost(envId,
                LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31));
        assertEquals(200.00, totalJuly, 0.01);
    }

    @Test
    @DisplayName("Deve retornar top services by cost")
    void testGetTopServicesByCost() {
        String envId = "env-top-test";

        costService.importCostRecord(
                new CostRecord(envId, "aws", "ec2", 500.00, "USD", LocalDate.of(2026, 6, 1)));
        costService.importCostRecord(
                new CostRecord(envId, "aws", "s3", 50.00, "USD", LocalDate.of(2026, 6, 1)));
        costService.importCostRecord(
                new CostRecord(envId, "aws", "ec2", 300.00, "USD", LocalDate.of(2026, 6, 15)));

        List<Object[]> topServices = costService.getTopServicesByCost(envId);
        assertFalse(topServices.isEmpty());
        // First entry should be ec2 (highest total)
        assertEquals("ec2", topServices.getFirst()[0]);
    }

    @Test
    @DisplayName("Deve criar e listar budgets por environment")
    void testCreateAndGetBudgets() {
        String envId = "env-budget-test";

        Budget b1 = costService.createBudget(new Budget(
                envId, "Monthly EC2", 1000.00, "USD",
                LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 30)));
        Budget b2 = costService.createBudget(new Budget(
                envId, "Monthly S3", 500.00, "USD",
                LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 30)));

        assertNotNull(b1.getId());
        assertNotNull(b2.getId());
        assertEquals("ACTIVE", b1.getStatus());
        assertEquals(0, b1.getSpentAmount());

        List<Budget> budgets = costService.getBudgets(envId);
        assertEquals(2, budgets.size());
    }

    @Test
    @DisplayName("Deve isolar cost records por tenant (environment)")
    void testTenantIsolation() {
        String envA = "env-tenant-a";
        String envB = "env-tenant-b";

        costService.importCostRecord(
                new CostRecord(envA, "aws", "ec2", 100.00, "USD", LocalDate.of(2026, 6, 1)));
        costService.importCostRecord(
                new CostRecord(envB, "aws", "ec2", 200.00, "USD", LocalDate.of(2026, 6, 1)));

        List<CostRecord> recordsA = costService.getCosts(envA, null, null);
        List<CostRecord> recordsB = costService.getCosts(envB, null, null);

        assertEquals(1, recordsA.size());
        assertEquals(1, recordsB.size());
        assertEquals(100.00, recordsA.getFirst().getAmount(), 0.01);
        assertEquals(200.00, recordsB.getFirst().getAmount(), 0.01);
    }

    @Test
    @DisplayName("Deve calcular monthly forecast")
    void testMonthlyForecast() {
        String envId = "env-forecast-test";

        // Import 300 total for first 10 days of month
        for (int day = 1; day <= 10; day++) {
            costService.importCostRecord(
                    new CostRecord(envId, "aws", "ec2", 30.00, "USD",
                            LocalDate.of(2026, 6, day)));
        }

        double forecast = costService.getMonthlyForecast(envId);
        // 300 total / 10 days * 30 days = 900
        assertTrue(forecast > 0, "Forecast should be positive");
    }
}
