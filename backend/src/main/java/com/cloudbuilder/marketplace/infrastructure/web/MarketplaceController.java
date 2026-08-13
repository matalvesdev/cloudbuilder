package com.cloudbuilder.marketplace.infrastructure.web;

import com.cloudbuilder.marketplace.application.dto.MarketplaceTemplateDTO;
import com.cloudbuilder.marketplace.domain.model.MarketplaceTemplate;
import com.cloudbuilder.marketplace.domain.service.MarketplaceCatalogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/marketplace")
public class MarketplaceController {

    private final MarketplaceCatalogService marketplaceService;

    public MarketplaceController(MarketplaceCatalogService marketplaceService) {
        this.marketplaceService = marketplaceService;
    }

    @GetMapping("/templates")
    public ResponseEntity<Page<MarketplaceTemplateDTO>> listTemplates(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(
            marketplaceService.listPublished(PageRequest.of(page, size))
                .map(MarketplaceTemplateDTO::from)
        );
    }

    @GetMapping("/templates/search")
    public ResponseEntity<Page<MarketplaceTemplateDTO>> searchTemplates(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(
            marketplaceService.search(q, PageRequest.of(page, size))
                .map(MarketplaceTemplateDTO::from)
        );
    }

    @GetMapping("/templates/{id}")
    public ResponseEntity<MarketplaceTemplateDTO> getTemplate(@PathVariable String id) {
        return ResponseEntity.ok(MarketplaceTemplateDTO.from(
            marketplaceService.listPublished(PageRequest.of(0, 1000))
                .getContent().stream()
                .filter(t -> t.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Template not found"))
        ));
    }

    @PostMapping("/templates/{id}/rate")
    public ResponseEntity<Map<String, Object>> rateTemplate(
            @PathVariable String id,
            @RequestParam double rating) {
        var template = marketplaceService.rateTemplate(id, rating);
        return ResponseEntity.ok(Map.of(
            "id", template.getId(),
            "rating", template.getRating(),
            "ratingCount", template.getRatingCount()
        ));
    }

    @PostMapping("/templates/{id}/download")
    public ResponseEntity<Void> downloadTemplate(@PathVariable String id) {
        marketplaceService.incrementDownloads(id);
        return ResponseEntity.ok().build();
    }
}
