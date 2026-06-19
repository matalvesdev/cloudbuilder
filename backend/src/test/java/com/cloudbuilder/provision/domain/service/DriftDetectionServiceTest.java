package com.cloudbuilder.provision.domain.service;

import com.cloudbuilder.provision.domain.model.DriftReport;
import com.cloudbuilder.provision.domain.model.ManagedResource;
import com.cloudbuilder.provision.domain.port.DriftReportRepository;
import com.cloudbuilder.provision.domain.port.ManagedResourceRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DriftDetectionServiceTest {

    @Mock
    private ManagedResourceRepository managedResourceRepository;

    @Mock
    private DriftReportRepository driftReportRepository;

    @Mock
    private StateService stateService;

    private ObjectMapper objectMapper;
    private DriftDetectionService service;

    private String envId;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        service = new DriftDetectionService(
                managedResourceRepository, driftReportRepository, stateService, objectMapper);
        envId = UUID.randomUUID().toString();
    }

    @Test
    void detectDrift_WithNoResources_ShouldReturnEmptyReport() {
        when(managedResourceRepository.findByEnvironmentId(envId)).thenReturn(List.of());
        when(driftReportRepository.save(any(DriftReport.class)))
                .thenAnswer(i -> i.getArgument(0));

        var report = service.detectDrift(envId, "{\"resources\": []}");

        assertNotNull(report);
        assertEquals(envId, report.getEnvironmentId());
        assertEquals("OPEN", report.getStatus());
        assertNotNull(report.getDetectedAt());
        verify(driftReportRepository).save(any(DriftReport.class));
    }

    @Test
    void detectDrift_WithRemovedResource_ShouldReportRemoval() {
        var resource = new ManagedResource(envId, "aws_vpc.main", "aws_vpc",
                "aws", "us-east-1", "{\"cidr_block\":\"10.0.0.0/16\"}");
        when(managedResourceRepository.findByEnvironmentId(envId)).thenReturn(List.of(resource));
        when(driftReportRepository.save(any(DriftReport.class)))
                .thenAnswer(i -> i.getArgument(0));

        var report = service.detectDrift(envId, "{\"resources\": []}");

        var details = report.getDriftDetails();
        assertNotNull(details);
        assertTrue(details.contains("aws_vpc.main"));
        assertTrue(details.contains("REMOVED"));
    }

    @Test
    void detectDrift_WithModifiedProperty_ShouldReportModification() throws Exception {
        var resource = new ManagedResource(envId, "aws_vpc.main", "aws_vpc",
                "aws", "us-east-1", "{\"cidr_block\":\"10.0.0.0/16\"}");
        var stateJson = "{ \"resources\": [{ \"address\": \"aws_vpc.main\", \"type\": \"aws_vpc\", " +
                "\"provider\": \"provider[\\\"registry.terraform.io/hashicorp/aws\\\"]\", " +
                "\"instances\": [{ \"attributes\": { \"cidr_block\": \"10.0.1.0/16\" } }] }] }";

        when(managedResourceRepository.findByEnvironmentId(envId)).thenReturn(List.of(resource));
        when(driftReportRepository.save(any(DriftReport.class)))
                .thenAnswer(i -> i.getArgument(0));

        var report = service.detectDrift(envId, stateJson);

        var details = report.getDriftDetails();
        assertNotNull(details);
        assertTrue(details.contains("MODIFIED"));
    }

    @Test
    void detectDrift_WithInvalidJson_ShouldThrow() {
        when(managedResourceRepository.findByEnvironmentId(envId)).thenReturn(List.of());

        assertThrows(RuntimeException.class, () ->
                service.detectDrift(envId, "invalid json"));
    }

    @Test
    void getDriftHistory_ShouldReturnOrderedList() {
        var report = new DriftReport(envId, "[]");
        when(driftReportRepository.findByEnvironmentIdOrderByDetectedAtDesc(envId))
                .thenReturn(List.of(report));

        var result = service.getDriftHistory(envId);

        assertEquals(1, result.size());
    }

    @Test
    void resolveDrift_ShouldSetResolved() {
        var reportId = UUID.randomUUID().toString();
        var report = new DriftReport(envId, "[]");
        when(driftReportRepository.findById(reportId)).thenReturn(Optional.of(report));
        when(driftReportRepository.save(report)).thenAnswer(i -> i.getArgument(0));

        var result = service.resolveDrift(reportId, "admin");

        assertEquals("RESOLVED", result.getStatus());
        assertEquals("admin", result.getResolvedBy());
        assertNotNull(result.getResolvedAt());
    }

    @Test
    void resolveDrift_WhenNotFound_ShouldThrow() {
        when(driftReportRepository.findById(any())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () ->
                service.resolveDrift(UUID.randomUUID().toString(), "admin"));
    }

    @Test
    void getLatestDrift_WhenPresent_ShouldReturn() {
        var report = new DriftReport(envId, "[]");
        when(driftReportRepository.findTopByEnvironmentIdOrderByDetectedAtDesc(envId))
                .thenReturn(Optional.of(report));

        var result = service.getLatestDrift(envId);

        assertTrue(result.isPresent());
    }

    @Test
    void getLatestDrift_WhenAbsent_ShouldReturnEmpty() {
        when(driftReportRepository.findTopByEnvironmentIdOrderByDetectedAtDesc(envId))
                .thenReturn(Optional.empty());

        var result = service.getLatestDrift(envId);

        assertTrue(result.isEmpty());
    }
}
