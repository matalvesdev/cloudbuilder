package com.cloudbuilder.platform.infrastructure.web;

import com.cloudbuilder.platform.domain.model.CatalogItem;
import com.cloudbuilder.platform.domain.model.CatalogItemVersion;
import com.cloudbuilder.platform.domain.model.MarketplaceListing;
import com.cloudbuilder.platform.domain.model.PartnerIntegration;
import com.cloudbuilder.platform.domain.service.CatalogService;
import com.cloudbuilder.platform.domain.service.MarketplaceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/platform")
@PreAuthorize("isAuthenticated()")
public class PlatformController {

    private final CatalogService catalogService;
    private final MarketplaceService marketplaceService;

    public PlatformController(CatalogService catalogService, MarketplaceService marketplaceService) {
        this.catalogService = catalogService;
        this.marketplaceService = marketplaceService;
    }

    @GetMapping("/catalog")
    public ResponseEntity<List<CatalogItem>> listCatalog(
            @RequestParam(required = false) String type) {
        return ResponseEntity.ok(catalogService.listItems(type));
    }

    @GetMapping("/catalog/draft")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CatalogItem>> listDraftItems() {
        return ResponseEntity.ok(catalogService.listItemsByStatus("DRAFT"));
    }

    @GetMapping("/catalog/published")
    public ResponseEntity<List<CatalogItem>> listPublishedItems() {
        return ResponseEntity.ok(catalogService.listItemsByStatus("PUBLISHED"));
    }

    @GetMapping("/catalog/{id}")
    public ResponseEntity<CatalogItem> getCatalogItem(@PathVariable String id) {
        return ResponseEntity.ok(catalogService.getItem(id));
    }

    @PostMapping("/catalog")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CatalogItem> createItem(@RequestBody CatalogItem item) {
        return ResponseEntity.status(HttpStatus.CREATED).body(catalogService.createItem(item));
    }

    @PutMapping("/catalog/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CatalogItem> updateItem(
            @PathVariable String id,
            @RequestBody UpdateItemRequest req) {
        return ResponseEntity.ok(catalogService.updateItem(
            id, req.name(), req.description(), req.schema()));
    }

    @PostMapping("/catalog/{id}/publish")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CatalogItem> publishItem(@PathVariable String id) {
        return ResponseEntity.ok(catalogService.publishItem(id));
    }

    @PostMapping("/catalog/{id}/unpublish")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CatalogItem> unpublishItem(@PathVariable String id) {
        return ResponseEntity.ok(catalogService.unpublishItem(id));
    }

    @GetMapping("/catalog/{id}/versions")
    public ResponseEntity<List<CatalogItemVersion>> getVersionHistory(@PathVariable String id) {
        return ResponseEntity.ok(catalogService.getVersionHistory(id));
    }

    @DeleteMapping("/catalog/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteItem(@PathVariable String id) {
        catalogService.deleteItem(id);
        return ResponseEntity.noContent().build();
    }

    record UpdateItemRequest(String name, String description, String schema) {}

    // --- Marketplace Listings ---

    @GetMapping("/marketplace")
    public ResponseEntity<List<MarketplaceListing>> listListings(
            @RequestParam(required = false) String cloudProvider) {
        if (cloudProvider != null) {
            return ResponseEntity.ok(marketplaceService.getListingsByProvider(cloudProvider));
        }
        return ResponseEntity.ok(marketplaceService.getAllListings());
    }

    @PostMapping("/marketplace")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MarketplaceListing> createListing(@RequestBody CreateListingRequest req) {
        var listing = marketplaceService.createListing(
            req.name(), req.description(), req.cloudProvider(),
            req.listingType(), req.version(), req.publisherName());
        return ResponseEntity.status(HttpStatus.CREATED).body(listing);
    }

    @PostMapping("/marketplace/{id}/publish")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MarketplaceListing> publishListing(@PathVariable String id) {
        return ResponseEntity.ok(marketplaceService.publishListing(id));
    }

    @PostMapping("/marketplace/{id}/unpublish")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MarketplaceListing> unpublishListing(@PathVariable String id) {
        return ResponseEntity.ok(marketplaceService.unpublishListing(id));
    }

    // --- Partner Integrations ---

    @GetMapping("/partners")
    public ResponseEntity<List<PartnerIntegration>> listPartners() {
        return ResponseEntity.ok(marketplaceService.getAllPartners());
    }

    @PostMapping("/partners")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PartnerIntegration> registerPartner(@RequestBody CreatePartnerRequest req) {
        var partner = marketplaceService.registerPartner(
            req.partnerName(), req.description(), req.integrationType());
        return ResponseEntity.status(HttpStatus.CREATED).body(partner);
    }

    @PostMapping("/partners/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PartnerIntegration> activatePartner(@PathVariable String id) {
        return ResponseEntity.ok(marketplaceService.activatePartner(id));
    }

    @PutMapping("/partners/{id}/config")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PartnerIntegration> updatePartnerConfig(
            @PathVariable String id, @RequestBody UpdatePartnerConfigRequest req) {
        return ResponseEntity.ok(marketplaceService.updatePartnerConfig(
            id, req.apiEndpoint(), req.configuration()));
    }

    record CreateListingRequest(String name, String description, String cloudProvider,
                                String listingType, String version, String publisherName) {}
    record CreatePartnerRequest(String partnerName, String description, String integrationType) {}
    record UpdatePartnerConfigRequest(String apiEndpoint, String configuration) {}
}
