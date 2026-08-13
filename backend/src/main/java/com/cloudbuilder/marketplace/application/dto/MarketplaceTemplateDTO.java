package com.cloudbuilder.marketplace.application.dto;

import com.cloudbuilder.marketplace.domain.model.MarketplaceTemplate;

public record MarketplaceTemplateDTO(
    String id,
    String name,
    String description,
    MarketplaceTemplate.TemplateType type,
    MarketplaceTemplate.TemplateCategory category,
    String author,
    String version,
    boolean published,
    int downloads,
    double rating
) {
    public static MarketplaceTemplateDTO from(MarketplaceTemplate t) {
        return new MarketplaceTemplateDTO(
            t.getId(), t.getName(), t.getDescription(),
            t.getType(), t.getCategory(), t.getAuthor(), t.getTemplateVersion(),
            t.isPublished(), t.getDownloads(), t.getRating()
        );
    }
}
