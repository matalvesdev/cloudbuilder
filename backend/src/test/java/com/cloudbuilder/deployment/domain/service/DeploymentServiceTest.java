package com.cloudbuilder.deployment.domain.service;

import com.cloudbuilder.deployment.domain.model.Deployment;
import com.cloudbuilder.deployment.domain.port.DeploymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeploymentServiceTest {

    @Mock
    private DeploymentRepository deploymentRepository;

    private DeploymentService service;

    @BeforeEach
    void setUp() {
        service = new DeploymentService(deploymentRepository);
    }

    @Test
    void create_ShouldSaveAndSetPendingStatus() {
        var deployment = new Deployment("t-1", "env-1", "canvas-1", "v1", "user-1");
        when(deploymentRepository.save(any(Deployment.class))).thenAnswer(inv -> inv.getArgument(0));

        var result = service.create(deployment);

        assertNotNull(result);
        assertEquals(Deployment.Status.PENDING, result.getStatus());
        assertNotNull(result.getStartedAt());
        verify(deploymentRepository).save(deployment);
    }

    @Test
    void findByEnvironmentId_ShouldReturn() {
        var d1 = new Deployment("t-1", "env-1", "canvas-1", "v1", "user-1");
        var d2 = new Deployment("t-1", "env-1", "canvas-1", "v2", "user-1");
        when(deploymentRepository.findByEnvironmentIdOrderByStartedAtDesc("env-1"))
                .thenReturn(List.of(d2, d1));

        var result = service.findByEnvironmentId("env-1");

        assertEquals(2, result.size());
        verify(deploymentRepository).findByEnvironmentIdOrderByStartedAtDesc("env-1");
    }

    @Test
    void findById_WhenFound_ShouldReturn() {
        var deployment = new Deployment("t-1", "env-1", "canvas-1", "v1", "user-1");
        when(deploymentRepository.findById("d-1")).thenReturn(Optional.of(deployment));

        var result = service.findById("d-1");

        assertTrue(result.isPresent());
        assertEquals("t-1", result.get().getTenantId());
    }

    @Test
    void findById_WhenNotFound_ShouldReturnEmpty() {
        when(deploymentRepository.findById("missing")).thenReturn(Optional.empty());

        assertTrue(service.findById("missing").isEmpty());
    }

    @Test
    void rollback_WhenFound_ShouldSetRolledBack() {
        var deployment = new Deployment("t-1", "env-1", "canvas-1", "v1", "user-1");
        deployment.setStatus(Deployment.Status.SUCCESS);
        when(deploymentRepository.findById("d-1")).thenReturn(Optional.of(deployment));
        when(deploymentRepository.save(any(Deployment.class))).thenAnswer(inv -> inv.getArgument(0));

        var result = service.rollback("d-1");

        assertTrue(result.isPresent());
        assertEquals(Deployment.Status.ROLLED_BACK, result.get().getStatus());
        assertNotNull(result.get().getCompletedAt());
        verify(deploymentRepository).save(deployment);
    }

    @Test
    void rollback_WhenNotFound_ShouldReturnEmpty() {
        when(deploymentRepository.findById("missing")).thenReturn(Optional.empty());

        assertTrue(service.rollback("missing").isEmpty());
        verify(deploymentRepository, never()).save(any());
    }
}
