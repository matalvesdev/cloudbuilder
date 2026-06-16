package com.cloudbuilder.platform.domain.port;

import com.cloudbuilder.platform.domain.model.MarketplaceListing;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MarketplaceListingRepository extends JpaRepository<MarketplaceListing, UUID> {
    List<MarketplaceListing> findByCloudProvider(String cloudProvider);
    List<MarketplaceListing> findByStatus(String status);
    List<MarketplaceListing> findByListingType(String listingType);
}
