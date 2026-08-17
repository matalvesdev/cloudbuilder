package com.cloudbuilder.marketplace.domain.service;

import com.cloudbuilder.marketplace.domain.model.MarketplaceTemplate;
import com.cloudbuilder.marketplace.domain.port.MarketplaceTemplateRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("MarketplaceCatalogService Tests")
class MarketplaceCatalogServiceTest {

    @Mock
    private MarketplaceTemplateRepository templateRepo;

    @InjectMocks
    private MarketplaceCatalogService catalogService;

    private MarketplaceTemplate createTemplate(String name) {
        return new MarketplaceTemplate(
            "tenant-1", name, "Description for " + name,
            MarketplaceTemplate.TemplateType.BLUEPRINT,
            MarketplaceTemplate.TemplateCategory.COMPUTE,
            "author-1", "1.0.0"
        );
    }

    @Test
    @DisplayName("createTemplate - saves and returns template")
    void createTemplate_savesAndReturns() {
        when(templateRepo.save(any())).thenAnswer(inv -> {
            MarketplaceTemplate t = inv.getArgument(0);
            try {
                var field = com.cloudbuilder.shared.kernel.AggregateRoot.class.getDeclaredField("id");
                field.setAccessible(true);
                field.set(t, "tpl-001");
            } catch (Exception ignored) {}
            return t;
        });

        MarketplaceTemplate result = catalogService.createTemplate(
            "tenant-1", "GCP Starter", "A GCP starter template",
            MarketplaceTemplate.TemplateType.BLUEPRINT,
            MarketplaceTemplate.TemplateCategory.COMPUTE,
            "author-1", "1.0.0"
        );

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("GCP Starter");
        assertThat(result.getTenantId()).isEqualTo("tenant-1");
        assertThat(result.isPublished()).isFalse();
        assertThat(result.getDownloads()).isZero();

        ArgumentCaptor<MarketplaceTemplate> captor = ArgumentCaptor.forClass(MarketplaceTemplate.class);
        verify(templateRepo).save(captor.capture());
        assertThat(captor.getValue().getAuthor()).isEqualTo("author-1");
    }

    @Test
    @DisplayName("listPublished - returns published templates")
    void listPublished_returnsResults() {
        MarketplaceTemplate tpl = createTemplate("Published Template");
        Page<MarketplaceTemplate> page = new PageImpl<>(List.of(tpl));
        when(templateRepo.findByPublishedTrueOrderByRatingDescDownloadsDesc(any(Pageable.class)))
            .thenReturn(page);

        Page<MarketplaceTemplate> result = catalogService.listPublished(PageRequest.of(0, 20));

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getName()).isEqualTo("Published Template");
    }

    @Test
    @DisplayName("search - finds templates by query")
    void search_findsTemplates() {
        MarketplaceTemplate tpl = createTemplate("Kubernetes Cluster");
        Page<MarketplaceTemplate> page = new PageImpl<>(List.of(tpl));
        when(templateRepo.search("kubernetes", PageRequest.of(0, 10))).thenReturn(page);

        Page<MarketplaceTemplate> result = catalogService.search("kubernetes", PageRequest.of(0, 10));

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getName()).isEqualTo("Kubernetes Cluster");
        verify(templateRepo).search("kubernetes", PageRequest.of(0, 10));
    }

    @Test
    @DisplayName("search - returns empty for no matches")
    void search_noMatches() {
        when(templateRepo.search("nonexistent", PageRequest.of(0, 10)))
            .thenReturn(new PageImpl<>(List.of()));

        Page<MarketplaceTemplate> result = catalogService.search("nonexistent", PageRequest.of(0, 10));

        assertThat(result.getContent()).isEmpty();
    }

    @Test
    @DisplayName("publishTemplate - sets published to true")
    void publishTemplate_setsPublished() {
        MarketplaceTemplate tpl = createTemplate("My Template");
        when(templateRepo.findById("tpl-001")).thenReturn(Optional.of(tpl));
        when(templateRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        MarketplaceTemplate result = catalogService.publishTemplate("tpl-001");

        assertThat(result.isPublished()).isTrue();
        verify(templateRepo).save(tpl);
    }

    @Test
    @DisplayName("publishTemplate - throws when not found")
    void publishTemplate_notFound() {
        when(templateRepo.findById("nonexistent")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> catalogService.publishTemplate("nonexistent"))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("Template not found");
    }

    @Test
    @DisplayName("rateTemplate - updates rating correctly")
    void rateTemplate_updatesRating() {
        MarketplaceTemplate tpl = createTemplate("My Template");
        when(templateRepo.findById("tpl-001")).thenReturn(Optional.of(tpl));
        when(templateRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        MarketplaceTemplate result = catalogService.rateTemplate("tpl-001", 4.5);

        assertThat(result.getRating()).isCloseTo(4.5, org.assertj.core.data.Offset.offset(0.01));
        assertThat(result.getRatingCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("rateTemplate - averages multiple ratings")
    void rateTemplate_averagesRatings() {
        MarketplaceTemplate tpl = createTemplate("My Template");
        when(templateRepo.findById("tpl-001")).thenReturn(Optional.of(tpl));
        when(templateRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        catalogService.rateTemplate("tpl-001", 5.0);
        catalogService.rateTemplate("tpl-001", 3.0);

        assertThat(tpl.getRating()).isCloseTo(4.0, org.assertj.core.data.Offset.offset(0.01));
        assertThat(tpl.getRatingCount()).isEqualTo(2);
    }

    @Test
    @DisplayName("rateTemplate - throws when not found")
    void rateTemplate_notFound() {
        when(templateRepo.findById("nonexistent")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> catalogService.rateTemplate("nonexistent", 5.0))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("Template not found");
    }

    @Test
    @DisplayName("incrementDownloads - increments counter")
    void incrementDownloads_increments() {
        MarketplaceTemplate tpl = createTemplate("My Template");
        when(templateRepo.findById("tpl-001")).thenReturn(Optional.of(tpl));
        when(templateRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        MarketplaceTemplate result = catalogService.incrementDownloads("tpl-001");

        assertThat(result.getDownloads()).isEqualTo(1);
        // Call again
        catalogService.incrementDownloads("tpl-001");
        assertThat(tpl.getDownloads()).isEqualTo(2);
    }

    @Test
    @DisplayName("incrementDownloads - throws when not found")
    void incrementDownloads_notFound() {
        when(templateRepo.findById("nonexistent")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> catalogService.incrementDownloads("nonexistent"))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("Template not found");
    }
}
