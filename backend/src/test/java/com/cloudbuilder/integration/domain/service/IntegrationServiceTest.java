package com.cloudbuilder.integration.domain.service;

import com.cloudbuilder.integration.domain.model.Integration;
import com.cloudbuilder.integration.domain.port.IntegrationRepository;
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
class IntegrationServiceTest {

    @Mock
    private IntegrationRepository integrationRepository;
    private IntegrationService service;

    @BeforeEach
    void setUp() {
        service = new IntegrationService(integrationRepository);
    }

    @Test
    void createIntegration_savesAndReturns() {
        when(integrationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var result = service.createIntegration("tenant-1", "user-1", "GitHub", "github", "scm", "{}");

        assertNotNull(result);
        assertEquals("GitHub", result.name());
        assertEquals("github", result.providerId());
        assertEquals("PENDING", result.status());
    }

    @Test
    void listIntegrations_returnsForTenant() {
        when(integrationRepository.findByTenantIdOrderByCreatedAtDesc("tenant-1"))
            .thenReturn(List.of(new Integration("tenant-1", "user-1", "GitHub", "github", "scm")));

        var result = service.listIntegrations("tenant-1");
        assertEquals(1, result.size());
    }

    @Test
    void getIntegration_returnsWhenExists() {
        var integration = new Integration("tenant-1", "user-1", "GitHub", "github", "scm");
        when(integrationRepository.findById("int-1")).thenReturn(Optional.of(integration));

        assertTrue(service.getIntegration("int-1").isPresent());
    }

    @Test
    void connectIntegration_connectsWhenFound() {
        var integration = new Integration("tenant-1", "user-1", "GitHub", "github", "scm");
        when(integrationRepository.findById("int-1")).thenReturn(Optional.of(integration));

        service.connectIntegration("int-1");
        verify(integrationRepository).save(integration);
    }

    @Test
    void disconnectIntegration_disconnectsWhenFound() {
        var integration = new Integration("tenant-1", "user-1", "GitHub", "github", "scm");
        when(integrationRepository.findById("int-1")).thenReturn(Optional.of(integration));

        service.disconnectIntegration("int-1");
        verify(integrationRepository).save(integration);
    }

    @Test
    void deleteIntegration_deletesWhenExists() {
        service.deleteIntegration("int-1");
        verify(integrationRepository).deleteById("int-1");
    }
}
