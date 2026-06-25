package com.cloudbuilder.search.domain.service;

import com.cloudbuilder.search.domain.model.SearchResult;
import com.cloudbuilder.search.domain.port.SearchProvider;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class GlobalSearchService {

    private final List<SearchProvider> searchProviders;

    public GlobalSearchService(Optional<List<SearchProvider>> searchProviders) {
        this.searchProviders = searchProviders.orElse(Collections.emptyList());
    }

    public List<SearchResult> search(String query, String tenantId, int maxResults) {
        if (query == null || query.trim().isEmpty()) {
            return Collections.emptyList();
        }
        String normalized = query.trim().toLowerCase();

        return searchProviders.stream()
                .flatMap(provider -> provider.search(normalized, tenantId, maxResults).stream())
                .sorted(Comparator.comparingDouble(SearchResult::getScore).reversed())
                .limit(maxResults)
                .collect(Collectors.toList());
    }

    public List<SearchResult> searchGrouped(String query, String tenantId, int maxResults) {
        return search(query, tenantId, maxResults * 2);
    }
}
