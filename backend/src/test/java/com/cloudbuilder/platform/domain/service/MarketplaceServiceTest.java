package com.cloudbuilder.platform.domain.service;

import com.cloudbuilder.platform.domain.model.MarketplaceListing;
import com.cloudbuilder.platform.domain.model.PartnerIntegration;
import com.cloudbuilder.platform.domain.port.MarketplaceListingRepository;
import com.cloudbuilder.platform.domain.port.PartnerIntegrationRepository;
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
class MarketplaceServiceTest {

    @Mock
    private MarketplaceListingRepository listingRepository;

    @Mock
    private PartnerIntegrationRepository partnerRepository;

    private MarketplaceService service;

    @BeforeEach
    void setUp() {
        service = new MarketplaceService(listingRepository, partnerRepository);
    }

    // --- Listings ---

    @Test
    void createListing_ShouldSaveAndReturn() {
        var listing = new MarketplaceListing("My App", "Description", "aws",
                "terraform", "1.0.0", "CloudBuilder");
        when(listingRepository.save(any(MarketplaceListing.class))).thenReturn(listing);

        var result = service.createListing("My App", "Description", "aws",
                "terraform", "1.0.0", "CloudBuilder");

        assertEquals("My App", result.getName());
        assertEquals("DRAFT", result.getStatus());
        assertEquals("aws", result.getCloudProvider());
        verify(listingRepository).save(any(MarketplaceListing.class));
    }

    @Test
    void getListingsByProvider_ShouldReturnFiltered() {
        var listing = new MarketplaceListing("App1", "Desc", "aws",
                "terraform", "1.0", "Pub");
        when(listingRepository.findByCloudProvider("aws")).thenReturn(List.of(listing));

        var result = service.getListingsByProvider("aws");

        assertEquals(1, result.size());
        assertEquals("App1", result.get(0).getName());
    }

    @Test
    void getListingsByStatus_ShouldReturnFiltered() {
        when(listingRepository.findByStatus("PUBLISHED")).thenReturn(List.of());

        var result = service.getListingsByStatus("PUBLISHED");

        assertTrue(result.isEmpty());
    }

    @Test
    void getAllListings_ShouldReturnAll() {
        var listing = new MarketplaceListing("App1", "Desc", "aws",
                "terraform", "1.0", "Pub");
        when(listingRepository.findAll()).thenReturn(List.of(listing));

        var result = service.getAllListings();

        assertEquals(1, result.size());
    }

    @Test
    void publishListing_ShouldSetStatusPublished() {
        var id = UUID.randomUUID().toString();
        var listing = new MarketplaceListing("App1", "Desc", "aws",
                "terraform", "1.0", "Pub");
        when(listingRepository.findById(id)).thenReturn(Optional.of(listing));
        when(listingRepository.save(listing)).thenAnswer(i -> i.getArgument(0));

        var result = service.publishListing(id);

        assertEquals("PUBLISHED", result.getStatus());
    }

    @Test
    void publishListing_WhenNotFound_ShouldThrow() {
        when(listingRepository.findById(any())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () ->
                service.publishListing(UUID.randomUUID().toString()));
    }

    @Test
    void unpublishListing_ShouldSetStatusUnpublished() {
        var id = UUID.randomUUID().toString();
        var listing = new MarketplaceListing("App1", "Desc", "aws",
                "terraform", "1.0", "Pub");
        when(listingRepository.findById(id)).thenReturn(Optional.of(listing));
        when(listingRepository.save(listing)).thenAnswer(i -> i.getArgument(0));

        var result = service.unpublishListing(id);

        assertEquals("UNPUBLISHED", result.getStatus());
    }

    // --- Partners ---

    @Test
    void registerPartner_ShouldSaveAndReturn() {
        var partner = new PartnerIntegration("PartnerCo", "Integration partner", "terraform");
        when(partnerRepository.save(any(PartnerIntegration.class))).thenReturn(partner);

        var result = service.registerPartner("PartnerCo", "Integration partner", "terraform");

        assertEquals("PartnerCo", result.getPartnerName());
        assertEquals("PENDING", result.getStatus());
        verify(partnerRepository).save(any(PartnerIntegration.class));
    }

    @Test
    void getActivePartners_ShouldReturnActive() {
        var partner = new PartnerIntegration("PartnerCo", "Desc", "api");
        partner.setStatus(PartnerIntegration.STATUS_ACTIVE);
        when(partnerRepository.findByStatus(PartnerIntegration.STATUS_ACTIVE))
                .thenReturn(List.of(partner));

        var result = service.getActivePartners();

        assertEquals(1, result.size());
        assertEquals("ACTIVE", result.get(0).getStatus());
    }

    @Test
    void getAllPartners_ShouldReturnAll() {
        when(partnerRepository.findAll()).thenReturn(List.of());

        var result = service.getAllPartners();

        assertTrue(result.isEmpty());
    }

    @Test
    void activatePartner_ShouldSetActive() {
        var id = UUID.randomUUID().toString();
        var partner = new PartnerIntegration("PartnerCo", "Desc", "api");
        when(partnerRepository.findById(id)).thenReturn(Optional.of(partner));
        when(partnerRepository.save(partner)).thenAnswer(i -> i.getArgument(0));

        var result = service.activatePartner(id);

        assertEquals("ACTIVE", result.getStatus());
    }

    @Test
    void activatePartner_WhenNotFound_ShouldThrow() {
        when(partnerRepository.findById(any())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () ->
                service.activatePartner(UUID.randomUUID().toString()));
    }

    @Test
    void updatePartnerConfig_ShouldSetApiEndpoint() {
        var id = UUID.randomUUID().toString();
        var partner = new PartnerIntegration("PartnerCo", "Desc", "api");
        when(partnerRepository.findById(id)).thenReturn(Optional.of(partner));
        when(partnerRepository.save(partner)).thenAnswer(i -> i.getArgument(0));

        var result = service.updatePartnerConfig(id, "https://api.example.com", null);

        assertEquals("https://api.example.com", result.getApiEndpoint());
        assertNull(result.getConfiguration());
    }

    @Test
    void updatePartnerConfig_ShouldSetConfiguration() {
        var id = UUID.randomUUID().toString();
        var partner = new PartnerIntegration("PartnerCo", "Desc", "api");
        when(partnerRepository.findById(id)).thenReturn(Optional.of(partner));
        when(partnerRepository.save(partner)).thenAnswer(i -> i.getArgument(0));

        var result = service.updatePartnerConfig(id, null, "{\"key\": \"val\"}");

        assertNull(result.getApiEndpoint());
        assertEquals("{\"key\": \"val\"}", result.getConfiguration());
    }

    @Test
    void updatePartnerConfig_WhenNotFound_ShouldThrow() {
        when(partnerRepository.findById(any())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () ->
                service.updatePartnerConfig(UUID.randomUUID().toString(), "ep", "cfg"));
    }
}
