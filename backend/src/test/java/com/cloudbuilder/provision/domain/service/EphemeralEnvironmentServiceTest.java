package com.cloudbuilder.provision.domain.service;

import com.cloudbuilder.provision.domain.model.EphemeralEnvironment;
import com.cloudbuilder.provision.domain.port.EphemeralEnvironmentRepository;
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
class EphemeralEnvironmentServiceTest {

    @Mock
    private EphemeralEnvironmentRepository repository;

    private EphemeralEnvironmentService service;

    @BeforeEach
    void setUp() {
        service = new EphemeralEnvironmentService(repository);
    }

    @Test
    void create_ShouldSaveAndReturnEnvironment() {
        var env = new EphemeralEnvironment("tenant1", "proj1", "test-env",
                "repo1", "main", UUID.randomUUID().toString(), 4, "small");
        when(repository.save(any(EphemeralEnvironment.class))).thenReturn(env);

        var result = service.create("tenant1", "proj1", "test-env",
                "repo1", "main", UUID.randomUUID().toString(), 4, "small");

        assertNotNull(result);
        assertEquals("test-env", result.getName());
        assertEquals("tenant1", result.getTenantId());
        assertEquals("CREATING", result.getStatus());
        verify(repository).save(any(EphemeralEnvironment.class));
    }

    @Test
    void getByTenant_ShouldReturnEnvironments() {
        var env = new EphemeralEnvironment("tenant1", "proj1", "env1",
                "repo1", "main", UUID.randomUUID().toString(), 4, "small");
        when(repository.findByTenantId("tenant1")).thenReturn(List.of(env));

        var result = service.getByTenant("tenant1");

        assertEquals(1, result.size());
        assertEquals("env1", result.get(0).getName());
    }

    @Test
    void getByProject_ShouldReturnEnvironments() {
        when(repository.findByProjectId("proj1")).thenReturn(List.of());

        var result = service.getByProject("proj1");

        assertTrue(result.isEmpty());
    }

    @Test
    void getById_WhenFound_ShouldReturnEnvironment() {
        var id = UUID.randomUUID().toString();
        var env = new EphemeralEnvironment("tenant1", "proj1", "env1",
                "repo1", "main", UUID.randomUUID().toString(), 4, "small");
        when(repository.findById(id)).thenReturn(Optional.of(env));

        var result = service.getById(id);

        assertTrue(result.isPresent());
        assertEquals("env1", result.get().getName());
    }

    @Test
    void getById_WhenNotFound_ShouldReturnEmpty() {
        when(repository.findById(any())).thenReturn(Optional.empty());

        var result = service.getById(UUID.randomUUID().toString());

        assertTrue(result.isEmpty());
    }

    @Test
    void destroy_ShouldMarkDestroying() {
        var id = UUID.randomUUID().toString();
        var env = new EphemeralEnvironment("tenant1", "proj1", "env1",
                "repo1", "main", UUID.randomUUID().toString(), 4, "small");
        when(repository.findById(id)).thenReturn(Optional.of(env));
        when(repository.save(env)).thenAnswer(i -> i.getArgument(0));

        var result = service.destroy(id);

        assertEquals("DESTROYING", result.getStatus());
        verify(repository).save(env);
    }

    @Test
    void destroy_WhenNotFound_ShouldThrow() {
        when(repository.findById(any())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> service.destroy(UUID.randomUUID().toString()));
    }

    @Test
    void completeDestroy_ShouldMarkDestroyed() {
        var id = UUID.randomUUID().toString();
        var env = new EphemeralEnvironment("tenant1", "proj1", "env1",
                "repo1", "main", UUID.randomUUID().toString(), 4, "small");
        when(repository.findById(id)).thenReturn(Optional.of(env));
        when(repository.save(env)).thenAnswer(i -> i.getArgument(0));

        var result = service.completeDestroy(id);

        assertEquals("DESTROYED", result.getStatus());
        assertNotNull(result.getDestroyedAt());
    }

    @Test
    void extendTtl_ShouldAddHours() {
        var id = UUID.randomUUID().toString();
        var env = new EphemeralEnvironment("tenant1", "proj1", "env1",
                "repo1", "main", UUID.randomUUID().toString(), 4, "small");
        // Simulate ACTIVE status by reflection or setter
        // We need to set status to ACTIVE for extendTtl to work
        env.markActive("http://localhost");
        when(repository.findById(id)).thenReturn(Optional.of(env));
        when(repository.save(env)).thenAnswer(i -> i.getArgument(0));

        var result = service.extendTtl(id, 2);

        assertEquals(6, result.getTtlHours());
    }

    @Test
    void extendTtl_WhenNotActive_ShouldThrow() {
        var id = UUID.randomUUID().toString();
        var env = new EphemeralEnvironment("tenant1", "proj1", "env1",
                "repo1", "main", UUID.randomUUID().toString(), 4, "small");
        // Status is CREATING by default, not ACTIVE
        when(repository.findById(id)).thenReturn(Optional.of(env));

        assertThrows(IllegalStateException.class, () -> service.extendTtl(id, 2));
    }

    @Test
    void activate_ShouldSetActiveAndBaseUrl() {
        var id = UUID.randomUUID().toString();
        var env = new EphemeralEnvironment("tenant1", "proj1", "env1",
                "repo1", "main", UUID.randomUUID().toString(), 4, "small");
        when(repository.findById(id)).thenReturn(Optional.of(env));
        when(repository.save(env)).thenAnswer(i -> i.getArgument(0));

        var result = service.activate(id, "http://example.com");

        assertEquals("ACTIVE", result.getStatus());
        assertEquals("http://example.com", result.getBaseUrl());
    }

    @Test
    void getExpiredEnvironments_ShouldReturnExpired() {
        when(repository.findByStatusAndExpiresAtBefore(eq("ACTIVE"), any(Instant.class)))
                .thenReturn(List.of());

        var result = service.getExpiredEnvironments();

        assertTrue(result.isEmpty());
    }

    @Test
    void getActiveCount_ShouldReturnCount() {
        when(repository.countByTenantIdAndStatusIn(eq("tenant1"), anyList())).thenReturn(3L);

        var result = service.getActiveCount("tenant1");

        assertEquals(3L, result);
    }

    @Test
    void delete_ShouldCallRepository() {
        var id = UUID.randomUUID().toString();
        doNothing().when(repository).deleteById(id);

        service.delete(id);

        verify(repository).deleteById(id);
    }
}
