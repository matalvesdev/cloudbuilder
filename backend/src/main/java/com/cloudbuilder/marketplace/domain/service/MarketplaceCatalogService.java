package com.cloudbuilder.marketplace.domain.service;

import com.cloudbuilder.marketplace.domain.model.MarketplaceTemplate;
import com.cloudbuilder.marketplace.domain.port.MarketplaceTemplateRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MarketplaceCatalogService {

    private final MarketplaceTemplateRepository templateRepo;

    public MarketplaceCatalogService(MarketplaceTemplateRepository templateRepo) {
        this.templateRepo = templateRepo;
    }

    @Transactional
    public MarketplaceTemplate createTemplate(String tenantId, String name, String description,
                                              MarketplaceTemplate.TemplateType type,
                                              MarketplaceTemplate.TemplateCategory category,
                                              String author, String version) {
        MarketplaceTemplate template = new MarketplaceTemplate(
            tenantId, name, description, type, category, author, version
        );
        return templateRepo.save(template);
    }

    public Page<MarketplaceTemplate> listPublished(Pageable pageable) {
        return templateRepo.findByPublishedTrueOrderByRatingDescDownloadsDesc(pageable);
    }

    public Page<MarketplaceTemplate> search(String query, Pageable pageable) {
        return templateRepo.search(query, pageable);
    }

    @Transactional
    public MarketplaceTemplate publishTemplate(String templateId) {
        MarketplaceTemplate template = templateRepo.findById(templateId)
            .orElseThrow(() -> new RuntimeException("Template not found"));
        template.publish();
        return templateRepo.save(template);
    }

    @Transactional
    public MarketplaceTemplate rateTemplate(String templateId, double rating) {
        MarketplaceTemplate template = templateRepo.findById(templateId)
            .orElseThrow(() -> new RuntimeException("Template not found"));
        template.addRating(rating);
        return templateRepo.save(template);
    }

    @Transactional
    public MarketplaceTemplate incrementDownloads(String templateId) {
        MarketplaceTemplate template = templateRepo.findById(templateId)
            .orElseThrow(() -> new RuntimeException("Template not found"));
        template.incrementDownloads();
        return templateRepo.save(template);
    }
}
