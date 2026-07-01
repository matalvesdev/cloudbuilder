package com.cloudbuilder.featureflags.domain.service;

import com.cloudbuilder.featureflags.application.dto.CreateFlagRequest;
import com.cloudbuilder.featureflags.application.dto.UpdateFlagRequest;
import com.cloudbuilder.featureflags.domain.model.FeatureFlag;
import com.cloudbuilder.featureflags.domain.port.FeatureFlagRepository;
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
class FeatureFlagServiceTest {

    @Mock
    private FeatureFlagRepository repository;

    private FeatureFlagService service;

    @BeforeEach
    void setUp() {
        service = new FeatureFlagService(repository);
    }

    // ── getFlags ────────────────────────────────────────────────────

    @Test
    void getFlags_NoTenantId_ReturnsGlobalFlagsSorted() {
        var global = new FeatureFlag("module.cost", true, null, null, "Cost module");
        when(repository.findByTenantIdIsNull()).thenReturn(List.of(global));
        when(repository.findByTenantId("t-1")).thenReturn(List.of());

        var result = service.getFlags("t-1");

        assertEquals(1, result.size());
        assertEquals("module.cost", result.get(0).getFlagKey());
        assertFalse(result.get(0).isResolved()); // global, not tenant override
    }

    @Test
    void getFlags_TenantOverride_WinsOverGlobal() {
        var global = new FeatureFlag("module.cost", false, null, null, "Global off");
        var tenant = new FeatureFlag("module.cost", true, "t-1", null, "Tenant on");
        when(repository.findByTenantIdIsNull()).thenReturn(List.of(global));
        when(repository.findByTenantId("t-1")).thenReturn(List.of(tenant));

        var result = service.getFlags("t-1");

        assertEquals(1, result.size());
        assertTrue(result.get(0).isEnabled()); // tenant override wins
        assertTrue(result.get(0).isResolved());
    }

    @Test
    void getFlags_NullTenantId_ReturnsGlobalOnly() {
        var global = new FeatureFlag("feature.x", true, null, null, "desc");
        when(repository.findByTenantIdIsNull()).thenReturn(List.of(global));

        var result = service.getFlags(null);

        assertEquals(1, result.size());
        assertFalse(result.get(0).isResolved());
    }

    @Test
    void getFlags_UnionOfGlobalAndTenantKeys() {
        var g1 = new FeatureFlag("module.cost", true, null, null, null);
        var g2 = new FeatureFlag("module.aiops", false, null, null, null);
        var t1 = new FeatureFlag("module.platform", true, "t-1", null, null);
        when(repository.findByTenantIdIsNull()).thenReturn(List.of(g1, g2));
        when(repository.findByTenantId("t-1")).thenReturn(List.of(t1));

        var result = service.getFlags("t-1");

        assertEquals(3, result.size());
        // sorted by flagKey
        assertEquals("module.aiops", result.get(0).getFlagKey());
        assertEquals("module.cost", result.get(1).getFlagKey());
        assertEquals("module.platform", result.get(2).getFlagKey());
    }

    // ── isEnabled ───────────────────────────────────────────────────

    @Test
    void isEnabled_TenantFlagExists_ReturnsTenantValue() {
        var tenantFlag = new FeatureFlag("module.cost", true, "t-1", null, null);
        when(repository.findByFlagKeyAndTenantId("module.cost", "t-1"))
                .thenReturn(Optional.of(tenantFlag));

        assertTrue(service.isEnabled("module.cost", "t-1"));
    }

    @Test
    void isEnabled_TenantFlagMissing_FallsBackToGlobal() {
        var globalFlag = new FeatureFlag("module.cost", true, null, null, null);
        when(repository.findByFlagKeyAndTenantId("module.cost", "t-1"))
                .thenReturn(Optional.empty());
        when(repository.findByFlagKeyAndTenantIdIsNull("module.cost"))
                .thenReturn(Optional.of(globalFlag));

        assertTrue(service.isEnabled("module.cost", "t-1"));
    }

    @Test
    void isEnabled_NoFlagAnywhere_ReturnsFalse() {
        when(repository.findByFlagKeyAndTenantId(anyString(), anyString()))
                .thenReturn(Optional.empty());
        when(repository.findByFlagKeyAndTenantIdIsNull(anyString()))
                .thenReturn(Optional.empty());

        assertFalse(service.isEnabled("nonexistent", "t-1"));
    }

    @Test
    void isEnabled_NullTenantId_ChecksGlobalOnly() {
        var globalFlag = new FeatureFlag("module.cost", false, null, null, null);
        when(repository.findByFlagKeyAndTenantIdIsNull("module.cost"))
                .thenReturn(Optional.of(globalFlag));

        assertFalse(service.isEnabled("module.cost", null));
    }

    // ── getConfig ───────────────────────────────────────────────────

    @Test
    void getConfig_TenantFlag_ReturnsTenantConfig() {
        var tenantFlag = new FeatureFlag("module.cost", true, "t-1", "{\"key\":\"val\"}", null);
        when(repository.findByFlagKeyAndTenantId("module.cost", "t-1"))
                .thenReturn(Optional.of(tenantFlag));

        var result = service.getConfig("module.cost", "t-1");

        assertTrue(result.isPresent());
        assertEquals("{\"key\":\"val\"}", result.get());
    }

    @Test
    void getConfig_NoFlag_ReturnsEmpty() {
        when(repository.findByFlagKeyAndTenantId(anyString(), anyString()))
                .thenReturn(Optional.empty());
        when(repository.findByFlagKeyAndTenantIdIsNull(anyString()))
                .thenReturn(Optional.empty());

        assertTrue(service.getConfig("nonexistent", "t-1").isEmpty());
    }

    // ── createFlag ──────────────────────────────────────────────────

    @Test
    void createFlag_ShouldSaveAndReturn() {
        var request = new CreateFlagRequest("module.cost", true, "t-1", null, "Cost module");
        when(repository.save(any(FeatureFlag.class))).thenAnswer(inv -> inv.getArgument(0));

        var result = service.createFlag(request);

        assertNotNull(result);
        assertEquals("module.cost", result.getFlagKey());
        assertTrue(result.isEnabled());
        assertEquals("t-1", result.getTenantId());
        assertTrue(result.isResolved());
        verify(repository).save(any(FeatureFlag.class));
    }

    // ── updateFlag ──────────────────────────────────────────────────

    @Test
    void updateFlag_WhenFound_ShouldUpdateAndReturn() {
        var existing = new FeatureFlag("module.cost", false, null, null, "old");
        when(repository.findById("id-1")).thenReturn(Optional.of(existing));
        when(repository.save(any(FeatureFlag.class))).thenAnswer(inv -> inv.getArgument(0));

        var request = new UpdateFlagRequest(true, "{\"updated\":true}", "new desc");
        var result = service.updateFlag("id-1", request);

        assertTrue(result.isPresent());
        assertTrue(result.get().isEnabled());
        assertEquals("{\"updated\":true}", result.get().getConfigJson());
        assertEquals("new desc", result.get().getDescription());
    }

    @Test
    void updateFlag_WhenNotFound_ShouldReturnEmpty() {
        when(repository.findById("missing")).thenReturn(Optional.empty());

        var result = service.updateFlag("missing", new UpdateFlagRequest(true, null, null));

        assertTrue(result.isEmpty());
    }

    // ── deleteFlag ──────────────────────────────────────────────────

    @Test
    void deleteFlag_WhenExists_ShouldDeleteAndReturnTrue() {
        when(repository.existsById("id-1")).thenReturn(true);

        assertTrue(service.deleteFlag("id-1"));
        verify(repository).deleteById("id-1");
    }

    @Test
    void deleteFlag_WhenNotExists_ShouldReturnFalse() {
        when(repository.existsById("missing")).thenReturn(false);

        assertFalse(service.deleteFlag("missing"));
        verify(repository, never()).deleteById(anyString());
    }

    // ── refreshCache ────────────────────────────────────────────────

    @Test
    void refreshCache_ShouldNotThrow() {
        assertDoesNotThrow(() -> service.refreshCache());
    }
}
