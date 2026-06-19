package com.cloudbuilder.observe.domain.service;

import com.cloudbuilder.observe.domain.model.Alert;
import com.cloudbuilder.observe.domain.model.ServiceHealth;
import com.cloudbuilder.observe.domain.port.AlertRepository;
import com.cloudbuilder.observe.domain.port.ServiceHealthRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HealthCheckServiceTest {

    @Mock
    private ServiceHealthRepository serviceHealthRepository;

    @Mock
    private AlertRepository alertRepository;

    private HealthCheckService healthCheckService;

    @BeforeEach
    void setUp() {
        healthCheckService = new HealthCheckService(serviceHealthRepository, alertRepository);
    }

    @Test
    void recordHealth_WithHealthyStatus_ShouldSaveHealthOnly() {
        var health = new ServiceHealth("api", "env-1", "healthy", 42.0, 99.9);
        when(serviceHealthRepository.save(any(ServiceHealth.class))).thenReturn(health);

        var result = healthCheckService.recordHealth("api", "env-1", "healthy", 42.0, 99.9);

        assertNotNull(result);
        assertEquals("healthy", result.getStatus());
        assertEquals("api", result.getServiceName());
        verify(serviceHealthRepository).save(any(ServiceHealth.class));
        verify(alertRepository, never()).save(any());
    }

    @Test
    void recordHealth_WithDegradedStatus_ShouldCreateWarningAlert() {
        var health = new ServiceHealth("api", "env-1", "degraded", 250.0, 95.0);
        when(serviceHealthRepository.save(any(ServiceHealth.class))).thenReturn(health);
        when(alertRepository.save(any(Alert.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = healthCheckService.recordHealth("api", "env-1", "degraded", 250.0, 95.0);

        assertEquals("degraded", result.getStatus());
        verify(serviceHealthRepository).save(any(ServiceHealth.class));
        verify(alertRepository).save(any(Alert.class));
    }

    @Test
    void recordHealth_WithDownStatus_ShouldCreateCriticalAlert() {
        var health = new ServiceHealth("api", "env-1", "down", 0.0, 0.0);
        when(serviceHealthRepository.save(any(ServiceHealth.class))).thenReturn(health);
        when(alertRepository.save(any(Alert.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = healthCheckService.recordHealth("api", "env-1", "down", 0.0, 0.0);

        assertEquals("down", result.getStatus());
        verify(alertRepository).save(any(Alert.class));
    }

    @Test
    void getServiceHealth_ShouldReturnList() {
        var healthList = List.of(
            new ServiceHealth("api", "env-1", "healthy", 20.0, 99.9),
            new ServiceHealth("db", "env-1", "healthy", 10.0, 100.0)
        );
        when(serviceHealthRepository.findByEnvironmentId("env-1")).thenReturn(healthList);

        var result = healthCheckService.getServiceHealth("env-1");

        assertEquals(2, result.size());
        verify(serviceHealthRepository).findByEnvironmentId("env-1");
    }

    @Test
    void getLatestHealth_WhenFound_ShouldReturnHealth() {
        var health = new ServiceHealth("api", "env-1", "healthy", 20.0, 99.9);
        when(serviceHealthRepository.findTopByServiceNameAndEnvironmentIdOrderByCheckedAtDesc("api", "env-1"))
            .thenReturn(Optional.of(health));

        var result = healthCheckService.getLatestHealth("api", "env-1");

        assertTrue(result.isPresent());
        assertEquals("api", result.get().getServiceName());
    }

    @Test
    void getActiveAlerts_ShouldReturnOrderedList() {
        var alerts = List.of(
            new Alert("env-1", "warning", "API degradado", "health-check"),
            new Alert("env-1", "critical", "DB down", "health-check")
        );
        when(alertRepository.findByEnvironmentIdOrderByTriggeredAtDesc("env-1")).thenReturn(alerts);

        var result = healthCheckService.getActiveAlerts("env-1");

        assertEquals(2, result.size());
    }

    @Test
    void getOpenAlerts_ShouldReturnOpenAlerts() {
        var alert = new Alert("env-1", "warning", "Test", "health-check");
        when(alertRepository.findByStatus("OPEN")).thenReturn(List.of(alert));

        var result = healthCheckService.getOpenAlerts();

        assertEquals(1, result.size());
    }

    @Test
    void resolveAlert_WhenFound_ShouldMarkResolved() {
        var alertId = UUID.randomUUID().toString();
        var alert = new Alert("env-1", "warning", "Test", "health-check");
        when(alertRepository.findById(alertId)).thenReturn(Optional.of(alert));
        when(alertRepository.save(any(Alert.class))).thenReturn(alert);

        var result = healthCheckService.resolveAlert(alertId);

        assertEquals("RESOLVED", result.getStatus());
        assertNotNull(result.getResolvedAt());
        verify(alertRepository).save(alert);
    }

    @Test
    void resolveAlert_WhenNotFound_ShouldThrow() {
        var alertId = UUID.randomUUID().toString();
        when(alertRepository.findById(alertId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> healthCheckService.resolveAlert(alertId));
    }
}
