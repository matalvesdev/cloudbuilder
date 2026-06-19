package com.cloudbuilder.multiregion.domain.service;

import com.cloudbuilder.multiregion.domain.model.Region;
import com.cloudbuilder.multiregion.domain.port.RegionRepository;
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
class RegionServiceTest {

    @Mock
    private RegionRepository regionRepository;

    private RegionService regionService;

    @BeforeEach
    void setUp() {
        regionService = new RegionService(regionRepository);
    }

    @Test
    void createRegion_ShouldSaveAndReturn() {
        when(regionRepository.existsByCode("us-east-1")).thenReturn(false);
        when(regionRepository.findByProviderAndIsActiveTrue("aws")).thenReturn(List.of());
        when(regionRepository.save(any(Region.class))).thenAnswer(i -> i.getArgument(0));

        var result = regionService.createRegion("us-east-1", "US East", "aws", "US", true);

        assertNotNull(result);
        assertEquals("us-east-1", result.getCode());
        assertTrue(result.isPrimary());
        verify(regionRepository).save(any(Region.class));
    }

    @Test
    void createRegion_WithDuplicateCode_ShouldThrow() {
        when(regionRepository.existsByCode("us-east-1")).thenReturn(true);

        assertThrows(IllegalArgumentException.class,
                () -> regionService.createRegion("us-east-1", "US East", "aws", "US", false));
    }

    @Test
    void createRegion_WithExistingPrimary_ShouldThrow() {
        var existingPrimary = new Region("us-west-2", "US West", "aws", "US", true);
        when(regionRepository.existsByCode("us-east-1")).thenReturn(false);
        when(regionRepository.findByProviderAndIsActiveTrue("aws")).thenReturn(List.of(existingPrimary));

        assertThrows(IllegalStateException.class,
                () -> regionService.createRegion("us-east-1", "US East", "aws", "US", true));
    }

    @Test
    void getRegion_ById_ShouldReturn() {
        var region = new Region("us-east-1", "US East", "aws", "US", false);
        var id = region.getId();
        when(regionRepository.findById(id)).thenReturn(Optional.of(region));

        var result = regionService.getRegion(id);

        assertTrue(result.isPresent());
        assertEquals("us-east-1", result.get().getCode());
    }

    @Test
    void getRegion_ByCode_ShouldReturn() {
        var region = new Region("us-east-1", "US East", "aws", "US", false);
        when(regionRepository.findByCode("us-east-1")).thenReturn(Optional.of(region));

        var result = regionService.getRegionByCode("us-east-1");

        assertTrue(result.isPresent());
    }

    @Test
    void getAllRegions_ShouldReturnList() {
        var regions = List.of(
                new Region("us-east-1", "US East", "aws", "US", true),
                new Region("eu-west-1", "EU West", "aws", "IE", false)
        );
        when(regionRepository.findAll()).thenReturn(regions);

        var result = regionService.getAllRegions();

        assertEquals(2, result.size());
    }

    @Test
    void getActiveRegions_ShouldReturnList() {
        when(regionRepository.findAllActiveOrdered()).thenReturn(List.of());

        var result = regionService.getActiveRegions();

        assertTrue(result.isEmpty());
    }

    @Test
    void getActiveRegionsByProvider_ShouldReturnList() {
        when(regionRepository.findByProviderAndIsActiveTrue("aws")).thenReturn(List.of());

        var result = regionService.getActiveRegionsByProvider("aws");

        assertTrue(result.isEmpty());
    }

    @Test
    void updateRegion_ShouldUpdateFields() {
        var region = new Region("us-east-1", "US East", "aws", "US", false);
        var id = region.getId();
        when(regionRepository.findById(id)).thenReturn(Optional.of(region));
        when(regionRepository.save(any(Region.class))).thenAnswer(i -> i.getArgument(0));

        var result = regionService.updateRegion(id, "US East Updated", "United States", null, null);

        assertEquals("US East Updated", result.getName());
        assertEquals("United States", result.getCountry());
        assertFalse(result.isPrimary());
    }

    @Test
    void updateRegion_WhenNotFound_ShouldThrow() {
        when(regionRepository.findById(any())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> regionService.updateRegion(UUID.randomUUID().toString(), "Name", "US", true, true));
    }

    @Test
    void updateRegion_WithIsPrimary_ShouldCheckExisting() {
        var region = new Region("us-east-1", "US East", "aws", "US", false);
        var id = region.getId();
        when(regionRepository.findById(id)).thenReturn(Optional.of(region));
        when(regionRepository.findByProviderAndIsActiveTrue("aws")).thenReturn(List.of());
        when(regionRepository.save(any(Region.class))).thenAnswer(i -> i.getArgument(0));

        var result = regionService.updateRegion(id, null, null, null, true);

        assertTrue(result.isPrimary());
    }

    @Test
    void deleteRegion_ShouldDelete() {
        var id = UUID.randomUUID().toString();
        when(regionRepository.existsById(id)).thenReturn(true);

        regionService.deleteRegion(id);

        verify(regionRepository).deleteById(id);
    }

    @Test
    void deleteRegion_WhenNotFound_ShouldThrow() {
        var id = UUID.randomUUID().toString();
        when(regionRepository.existsById(id)).thenReturn(false);

        assertThrows(IllegalArgumentException.class, () -> regionService.deleteRegion(id));
    }

    @Test
    void setPrimaryRegion_ShouldUnsetExistingAndSetNew() {
        var existingPrimary = new Region("us-west-2", "US West", "aws", "US", true);
        var newPrimary = new Region("us-east-1", "US East", "aws", "US", false);
        var newId = newPrimary.getId();

        when(regionRepository.findById(newId)).thenReturn(Optional.of(newPrimary));
        when(regionRepository.findByProviderAndIsActiveTrue("aws")).thenReturn(List.of(existingPrimary));
        when(regionRepository.save(any(Region.class))).thenAnswer(i -> i.getArgument(0));

        var result = regionService.setPrimaryRegion(newId);

        assertTrue(result.isPrimary());
        assertFalse(existingPrimary.isPrimary());
        verify(regionRepository, times(2)).save(any(Region.class));
    }
}
