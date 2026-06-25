package com.cloudbuilder.search.domain.model;

/**
 * Value object representing a search result from any module in the platform.
 *
 * Migrated from inner class GlobalSearchService.SearchResult to a proper
 * domain model as part of ADR-021 hexagonal architecture refactoring.
 */
public class SearchResult {

    private final String id;
    private final String title;
    private final String description;
    private final String module;
    private final String resourceType;
    private final String resourceId;
    private final double score;

    public SearchResult(String id, String title, String description, String module,
                        String resourceType, String resourceId, double score) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.module = module;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.score = score;
    }

    public String getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getModule() {
        return module;
    }

    public String getResourceType() {
        return resourceType;
    }

    public String getResourceId() {
        return resourceId;
    }

    public double getScore() {
        return score;
    }
}
