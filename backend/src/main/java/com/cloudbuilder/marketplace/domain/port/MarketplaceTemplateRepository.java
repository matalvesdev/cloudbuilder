package com.cloudbuilder.marketplace.domain.port;

import com.cloudbuilder.marketplace.domain.model.MarketplaceTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MarketplaceTemplateRepository extends JpaRepository<MarketplaceTemplate, String> {

    Page<MarketplaceTemplate> findByPublishedTrueOrderByRatingDescDownloadsDesc(Pageable pageable);

    Page<MarketplaceTemplate> findByTenantIdAndPublishedTrueOrderByCreatedAtDesc(
        String tenantId, Pageable pageable);

    Page<MarketplaceTemplate> findByTypeAndPublishedTrue(
        MarketplaceTemplate.TemplateType type, Pageable pageable);

    Page<MarketplaceTemplate> findByCategoryAndPublishedTrue(
        MarketplaceTemplate.TemplateCategory category, Pageable pageable);

    @Query("SELECT t FROM MarketplaceTemplate t WHERE t.published = true " +
           "AND (LOWER(t.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(t.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<MarketplaceTemplate> search(@Param("query") String query, Pageable pageable);

    List<MarketplaceTemplate> findByAuthorAndTenantId(String author, String tenantId);
}
