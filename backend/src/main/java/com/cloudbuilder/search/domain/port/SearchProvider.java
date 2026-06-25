package com.cloudbuilder.search.domain.port;

import com.cloudbuilder.search.domain.model.SearchResult;

import java.util.List;

/**
 * Interface that each module implements to contribute search results to the
 * global search feature.
 *
 * Migrated from inner interface GlobalSearchService.SearchProvider to a proper
 * domain port as part of ADR-021 hexagonal architecture refactoring.
 */
public interface SearchProvider {

    List<SearchResult> search(String query, String tenantId, int maxResults);

    String getModuleName();
}
