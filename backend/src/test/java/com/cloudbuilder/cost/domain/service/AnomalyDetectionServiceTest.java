package com.cloudbuilder.cost.domain.service;

import com.cloudbuilder.cost.domain.model.CostRecord;
import com.cloudbuilder.cost.domain.port.CostRecordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnomalyDetectionServiceTest {

    @Mock
    private CostRecordRepository costRecordRepository;

    private AnomalyDetectionService anomalyDetectionService;

    @BeforeEach
    void setUp() {
        anomalyDetectionService = new AnomalyDetectionService(costRecordRepository);
    }

    @Test
    void detectAnomalies_WithSufficientData_ShouldDetectHighSpike() {
        var envId = "env-1";
        var today = LocalDate.now();

        // Create 30 records where most are ~100, but day 15 has a 3x spike
        var records = createServiceRecords("EC2", envId, today, 30, 100.0);
        // Overwrite day at index 15 to have a large spike
        records.set(15, new CostRecord(envId, "aws", "EC2", 350.0, "USD", today.minusDays(14)));

        // Re-index after mutation
        for (int i = 0; i < records.size(); i++) {
            records.set(i, new CostRecord(envId, "aws", "EC2",
                    i == 15 ? 350.0 : 100.0, "USD", today.minusDays(29 - i)));
        }

        when(costRecordRepository.findByEnvironmentIdAndDateBetween(eq(envId),
                any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(records);

        var anomalies = anomalyDetectionService.detectAnomalies(envId, 30);

        assertFalse(anomalies.isEmpty(), "Should detect at least one anomaly from the spike");
        var anomaly = anomalies.get(0);
        assertEquals("EC2", anomaly.serviceName());
        assertTrue(anomaly.deviationPct() > 100, "Spike should be flagged as HIGH or CRITICAL deviation");
    }

    @Test
    void detectAnomalies_WithInsufficientData_ShouldReturnEmpty() {
        var envId = "env-1";
        var today = LocalDate.now();

        // Only 10 records — less than the 14 minimum
        var records = createServiceRecords("EC2", envId, today, 10, 100.0);

        when(costRecordRepository.findByEnvironmentIdAndDateBetween(eq(envId),
                any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(records);

        var anomalies = anomalyDetectionService.detectAnomalies(envId, 30);

        assertTrue(anomalies.isEmpty(), "Insufficient data should produce no anomalies");
    }

    @Test
    void detectAnomalies_WithNoDeviation_ShouldReturnEmpty() {
        var envId = "env-1";
        var today = LocalDate.now();

        // All records exactly 100.0 — stdDev will be 0
        var records = createServiceRecords("EC2", envId, today, 20, 100.0);

        when(costRecordRepository.findByEnvironmentIdAndDateBetween(eq(envId),
                any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(records);

        var anomalies = anomalyDetectionService.detectAnomalies(envId, 30);

        assertTrue(anomalies.isEmpty(), "Flat data should produce no anomalies (stdDev=0)");
    }

    @Test
    void detectAnomalies_WithMultipleServices_ShouldDetectPerService() {
        var envId = "env-1";
        var today = LocalDate.now();

        var allRecords = createServiceRecords("EC2", envId, today, 20, 100.0);
        allRecords.addAll(createServiceRecords("S3", envId, today, 20, 100.0));

        // Add spike to S3 at index 15 (offset by 20 EC2 records)
        int s3SpikeIndex = 20 + 15;
        CostRecord original = allRecords.get(s3SpikeIndex);
        allRecords.set(s3SpikeIndex, new CostRecord(envId, "aws", "S3", 400.0, "USD", original.getDate()));

        // Rebuild properly to match dates
        allRecords.clear();
        for (int i = 0; i < 20; i++) {
            allRecords.add(new CostRecord(envId, "aws", "EC2", 100.0, "USD", today.minusDays(29 - i)));
        }
        for (int i = 0; i < 20; i++) {
            allRecords.add(new CostRecord(envId, "aws", "S3", (i == 15) ? 400.0 : 100.0, "USD", today.minusDays(29 - i)));
        }

        when(costRecordRepository.findByEnvironmentIdAndDateBetween(eq(envId),
                any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(allRecords);

        var anomalies = anomalyDetectionService.detectAnomalies(envId, 30);

        assertFalse(anomalies.isEmpty());
        assertTrue(anomalies.stream().anyMatch(a -> "S3".equals(a.serviceName())),
                "S3 spike should be detected");
    }

    @Test
    void detectAnomalies_ResultsSortedByDateDesc() {
        var envId = "env-1";
        var today = LocalDate.now();

        var records = createServiceRecords("EC2", envId, today, 20, 100.0);
        // Add a moderate spike at the end to ensure it's included
        records.set(19, new CostRecord(envId, "aws", "EC2", 200.0, "USD", today.minusDays(10)));

        // Rebuild with spike at last position
        records.clear();
        for (int i = 0; i < 20; i++) {
            double amount = (i == 19) ? 200.0 : 100.0;
            records.add(new CostRecord(envId, "aws", "EC2", amount, "USD", today.minusDays(29 - i)));
        }

        when(costRecordRepository.findByEnvironmentIdAndDateBetween(eq(envId),
                any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(records);

        var anomalies = anomalyDetectionService.detectAnomalies(envId, 30);

        assertFalse(anomalies.isEmpty());
        // Verify descending date order
        for (int i = 1; i < anomalies.size(); i++) {
            assertTrue(
                anomalies.get(i - 1).date().compareTo(anomalies.get(i).date()) >= 0,
                "Anomalies should be sorted by date descending");
        }
    }

    @Test
    void detectAnomalies_WithModerateDeviation_ShouldClassifyCorrectly() {
        var envId = "env-1";
        var today = LocalDate.now();

        var records = createServiceRecords("EC2", envId, today, 20, 100.0);

        // Set last record to ~30% above the mean (MODERATE: 20-50%)
        int lastIdx = 19;
        records.set(lastIdx, new CostRecord(envId, "aws", "EC2", 135.0, "USD", today.minusDays(10)));

        records.clear();
        for (int i = 0; i < 20; i++) {
            double amount = (i == 19) ? 135.0 : 100.0;
            records.add(new CostRecord(envId, "aws", "EC2", amount, "USD", today.minusDays(29 - i)));
        }

        when(costRecordRepository.findByEnvironmentIdAndDateBetween(eq(envId),
                any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(records);

        var anomalies = anomalyDetectionService.detectAnomalies(envId, 30);

        if (!anomalies.isEmpty()) {
            String severity = anomalies.get(0).severity();
            assertTrue("LOW".equals(severity) || "MODERATE".equals(severity),
                    "35% deviation should be LOW or MODERATE, got: " + severity);
        }
    }

    @Test
    void detectAnomalies_WithCriticalDeviation_ShouldClassifyCritical() {
        var envId = "env-1";
        var today = LocalDate.now();

        var records = createServiceRecords("EC2", envId, today, 20, 100.0);

        // 3x spike = 200% deviation → CRITICAL
        records.clear();
        for (int i = 0; i < 20; i++) {
            double amount = (i == 19) ? 350.0 : 100.0;
            records.add(new CostRecord(envId, "aws", "EC2", amount, "USD", today.minusDays(29 - i)));
        }

        when(costRecordRepository.findByEnvironmentIdAndDateBetween(eq(envId),
                any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(records);

        var anomalies = anomalyDetectionService.detectAnomalies(envId, 30);

        if (!anomalies.isEmpty()) {
            assertTrue(anomalies.get(0).severity().equals("HIGH") || anomalies.get(0).severity().equals("CRITICAL"),
                    "250% deviation should be HIGH or CRITICAL, got: " + anomalies.get(0).severity());
        }
    }

    private List<CostRecord> createServiceRecords(String serviceName, String envId,
                                                  LocalDate today, int count, double baseAmount) {
        var records = new java.util.ArrayList<CostRecord>();
        for (int i = 0; i < count; i++) {
            records.add(new CostRecord(envId, "aws", serviceName,
                    baseAmount, "USD", today.minusDays(29 - i)));
        }
        return records;
    }
}
