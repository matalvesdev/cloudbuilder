package com.cloudbuilder.environment.domain.service;

import com.cloudbuilder.environment.domain.model.ManagedEnvironment;
import com.cloudbuilder.environment.domain.port.EnvironmentRepository;
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
class EnvironmentServiceTest {

    @Mock
    private EnvironmentRepository environmentRepository;

    private EnvironmentService service;

    private ManagedEnvironment testEnv;

    @BeforeEach
    void setUp() {
        service = new EnvironmentService(environmentRepository);
        testEnv = new ManagedEnvironment("tenant-1", "Production", "google", "us-central1", "cred-1");
    }

    @Test
    void create_savesAndReturnsEnvironment() {
        when(environmentRepository.save(any())).thenReturn(testEnv);

        ManagedEnvironment result = service.create(testEnv);

        assertNotNull(result);
        assertEquals("Production", result.getName());
        assertEquals("google", result.getProvider());
        verify(environmentRepository).save(testEnv);
    }

    @Test
    void findByTenantId_returnsEnvironmentsForTenant() {
        var env2 = new ManagedEnvironment("tenant-1", "Staging", "aws", "us-east-1", "cred-2");
        when(environmentRepository.findByTenantId("tenant-1")).thenReturn(List.of(testEnv, env2));

        List<ManagedEnvironment> result = service.findByTenantId("tenant-1");

        assertEquals(2, result.size());
    }

    @Test
    void findById_returnsEnvironmentWhenExists() {
        when(environmentRepository.findById("env-1")).thenReturn(Optional.of(testEnv));

        Optional<ManagedEnvironment> result = service.findById("env-1");

        assertTrue(result.isPresent());
        assertEquals("Production", result.get().getName());
    }

    @Test
    void findById_returnsEmptyWhenNotFound() {
        when(environmentRepository.findById("nonexistent")).thenReturn(Optional.empty());

        Optional<ManagedEnvironment> result = service.findById("nonexistent");

        assertFalse(result.isPresent());
    }

    @Test
    void update_modifiesEnvironmentFields() {
        when(environmentRepository.findById("env-1")).thenReturn(Optional.of(testEnv));
        when(environmentRepository.save(any())).thenReturn(testEnv);

        Optional<ManagedEnvironment> result = service.update("env-1",
            "New Name", "Updated", "aws", "us-east-1", "cred-2", "{}", ManagedEnvironment.Status.ACTIVE);

        assertTrue(result.isPresent());
        verify(environmentRepository).save(any());
    }

    @Test
    void update_returnsEmptyWhenNotFound() {
        when(environmentRepository.findById("nonexistent")).thenReturn(Optional.empty());

        Optional<ManagedEnvironment> result = service.update("nonexistent",
            "name", "desc", "aws", "us-east-1", "cred", "{}", ManagedEnvironment.Status.ACTIVE);

        assertFalse(result.isPresent());
        verify(environmentRepository, never()).save(any());
    }

    @Test
    void delete_callsRepositoryDelete() {
        service.delete("env-1");
        verify(environmentRepository).deleteById("env-1");
    }
}
