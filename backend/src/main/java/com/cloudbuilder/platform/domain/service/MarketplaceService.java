package com.cloudbuilder.platform.domain.service;

import com.cloudbuilder.platform.domain.model.MarketplaceListing;
import com.cloudbuilder.platform.domain.model.PartnerIntegration;
import com.cloudbuilder.platform.domain.port.MarketplaceListingRepository;
import com.cloudbuilder.platform.domain.port.PartnerIntegrationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class MarketplaceService {

    private final MarketplaceListingRepository listingRepository;
    private final PartnerIntegrationRepository partnerRepository;

    public MarketplaceService(MarketplaceListingRepository listingRepository,
                              PartnerIntegrationRepository partnerRepository) {
        this.listingRepository = listingRepository;
        this.partnerRepository = partnerRepository;
    }

    // --- Listings ---

    public MarketplaceListing createListing(String name, String description, String cloudProvider,
                                             String listingType, String version, String publisherName) {
        var listing = new MarketplaceListing(name, description, cloudProvider,
            listingType, version, publisherName);
        return listingRepository.save(listing);
    }

    @Transactional(readOnly = true)
    public List<MarketplaceListing> getListingsByProvider(String cloudProvider) {
        return listingRepository.findByCloudProvider(cloudProvider);
    }

    @Transactional(readOnly = true)
    public List<MarketplaceListing> getListingsByStatus(String status) {
        return listingRepository.findByStatus(status);
    }

    @Transactional(readOnly = true)
    public List<MarketplaceListing> getAllListings() {
        return listingRepository.findAll();
    }

    public MarketplaceListing publishListing(UUID id) {
        var listing = listingRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Listing not found: " + id));
        listing.setStatus(MarketplaceListing.STATUS_PUBLISHED);
        return listingRepository.save(listing);
    }

    public MarketplaceListing unpublishListing(UUID id) {
        var listing = listingRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Listing not found: " + id));
        listing.setStatus(MarketplaceListing.STATUS_UNPUBLISHED);
        return listingRepository.save(listing);
    }

    // --- Partners ---

    public PartnerIntegration registerPartner(String partnerName, String description, String integrationType) {
        var partner = new PartnerIntegration(partnerName, description, integrationType);
        return partnerRepository.save(partner);
    }

    @Transactional(readOnly = true)
    public List<PartnerIntegration> getActivePartners() {
        return partnerRepository.findByStatus(PartnerIntegration.STATUS_ACTIVE);
    }

    @Transactional(readOnly = true)
    public List<PartnerIntegration> getAllPartners() {
        return partnerRepository.findAll();
    }

    public PartnerIntegration activatePartner(UUID id) {
        var partner = partnerRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Partner not found: " + id));
        partner.setStatus(PartnerIntegration.STATUS_ACTIVE);
        return partnerRepository.save(partner);
    }

    public PartnerIntegration updatePartnerConfig(UUID id, String apiEndpoint, String configuration) {
        var partner = partnerRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Partner not found: " + id));
        if (apiEndpoint != null) partner.setApiEndpoint(apiEndpoint);
        if (configuration != null) partner.setConfiguration(configuration);
        return partnerRepository.save(partner);
    }
}
