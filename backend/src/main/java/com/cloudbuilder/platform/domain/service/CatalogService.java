package com.cloudbuilder.platform.domain.service;

import com.cloudbuilder.platform.domain.model.CatalogItem;
import com.cloudbuilder.platform.domain.model.CatalogItemVersion;
import com.cloudbuilder.platform.domain.port.CatalogItemRepository;
import com.cloudbuilder.platform.domain.port.CatalogItemVersionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CatalogService {

    private static final String STATUS_DRAFT = "DRAFT";
    private static final String STATUS_PUBLISHED = "PUBLISHED";

    private final CatalogItemRepository repository;
    private final CatalogItemVersionRepository versionRepository;

    public CatalogService(CatalogItemRepository repository, CatalogItemVersionRepository versionRepository) {
        this.repository = repository;
        this.versionRepository = versionRepository;
    }

    public CatalogItem createItem(CatalogItem item) {
        item.setStatus(STATUS_DRAFT);
        var saved = repository.save(item);
        versionRepository.save(new CatalogItemVersion(saved));
        return saved;
    }

    @Transactional(readOnly = true)
    public List<CatalogItem> listItems(String type) {
        if (type != null && !type.isBlank()) {
            return repository.findByType(type);
        }
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public List<CatalogItem> listItemsByStatus(String status) {
        return repository.findByStatus(status);
    }

    @Transactional(readOnly = true)
    public CatalogItem getItem(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Catalog item not found: " + id));
    }

    /**
     * Update catalog item metadata, auto-create a version snapshot,
     * and auto-bump patch version.
     */
    public CatalogItem updateItem(String id, String name, String description, String schema) {
        var item = getItem(id);
        if (name != null && !name.isBlank()) item.setName(name);
        if (description != null) item.setDescription(description);
        if (schema != null) item.setSchema(schema);

        // Auto-bump patch version (e.g., 1.0.0 → 1.0.1)
        var nextVersion = bumpPatch(item.getVersion());
        item.setVersion(nextVersion);

        var saved = repository.save(item);
        versionRepository.save(new CatalogItemVersion(saved));
        return saved;
    }

    /**
     * Publish a draft item: DRAFT → PUBLISHED.
     */
    public CatalogItem publishItem(String id) {
        var item = getItem(id);
        if (!STATUS_DRAFT.equals(item.getStatus())) {
            throw new IllegalStateException(
                "Cannot publish item with status '" + item.getStatus() + "'. Only DRAFT items can be published.");
        }
        item.setStatus(STATUS_PUBLISHED);
        return repository.save(item);
    }

    /**
     * Unpublish a published item: PUBLISHED → DRAFT.
     */
    public CatalogItem unpublishItem(String id) {
        var item = getItem(id);
        if (!STATUS_PUBLISHED.equals(item.getStatus())) {
            throw new IllegalStateException(
                "Cannot unpublish item with status '" + item.getStatus() + "'. Only PUBLISHED items can be unpublished.");
        }
        item.setStatus(STATUS_DRAFT);
        return repository.save(item);
    }

    @Transactional(readOnly = true)
    public List<CatalogItemVersion> getVersionHistory(String catalogItemId) {
        return versionRepository.findByCatalogItemIdOrderByCreatedAtDesc(catalogItemId);
    }

    public void deleteItem(String id) {
        repository.deleteById(id);
    }

    // ─── Private helpers ─────────────────────────────────────

    private static String bumpPatch(String version) {
        if (version == null || version.isBlank()) return "1.0.0";
        try {
            var parts = version.split("\\.");
            int major = Integer.parseInt(parts[0]);
            int minor = parts.length > 1 ? Integer.parseInt(parts[1]) : 0;
            int patch = parts.length > 2 ? Integer.parseInt(parts[2]) + 1 : 1;
            return major + "." + minor + "." + patch;
        } catch (NumberFormatException e) {
            return version + ".1";
        }
    }
}
