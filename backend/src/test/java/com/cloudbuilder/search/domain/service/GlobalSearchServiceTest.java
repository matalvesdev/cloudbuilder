package com.cloudbuilder.search.domain.service;

import com.cloudbuilder.search.domain.model.SearchResult;
import com.cloudbuilder.search.domain.port.SearchProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GlobalSearchServiceTest {

    private SearchProvider mockProvider;
    private GlobalSearchService service;

    @BeforeEach
    void setUp() {
        mockProvider = mock(SearchProvider.class);
        service = new GlobalSearchService(Optional.of(List.of(mockProvider)));
    }

    @Test
    void search_returnsEmptyForNullQuery() {
        List<SearchResult> results = service.search(null, "tenant-1", 10);
        assertTrue(results.isEmpty());
        verifyNoInteractions(mockProvider);
    }

    @Test
    void search_returnsEmptyForBlankQuery() {
        List<SearchResult> results = service.search("   ", "tenant-1", 10);
        assertTrue(results.isEmpty());
        verifyNoInteractions(mockProvider);
    }

    @Test
    void search_aggregatesResultsFromMultipleProviders() {
        var provider2 = mock(SearchProvider.class);
        service = new GlobalSearchService(Optional.of(List.of(mockProvider, provider2)));

        var result1 = new SearchResult("canvas-1", "Production Stack", "GCP VPC", "canvas", "resource", "canvas-1", 0.9);
        var result2 = new SearchResult("cred-1", "GCP SA", "Service Account", "credential", "credential", "cred-1", 0.8);

        when(mockProvider.search("vpc", "tenant-1", 10)).thenReturn(List.of(result1));
        when(provider2.search("vpc", "tenant-1", 10)).thenReturn(List.of(result2));

        List<SearchResult> results = service.search("vpc", "tenant-1", 10);

        assertEquals(2, results.size());
        // Higher score first
        assertEquals("Production Stack", results.get(0).getTitle());
        assertEquals("GCP SA", results.get(1).getTitle());
    }

    @Test
    void search_respectsMaxResultsLimit() {
        var result1 = new SearchResult("1", "R1", "desc", "canvas", "resource", "1", 0.9);
        var result2 = new SearchResult("2", "R2", "desc", "canvas", "resource", "2", 0.8);

        when(mockProvider.search("test", "tenant-1", 1)).thenReturn(List.of(result1, result2));

        List<SearchResult> results = service.search("test", "tenant-1", 1);

        assertEquals(1, results.size());
    }

    @Test
    void search_sortsByScoreDescending() {
        var result1 = new SearchResult("low", "Low Score", "desc", "canvas", "resource", "low", 0.3);
        var result2 = new SearchResult("high", "High Score", "desc", "canvas", "resource", "high", 0.95);
        var result3 = new SearchResult("mid", "Mid Score", "desc", "canvas", "resource", "mid", 0.6);

        when(mockProvider.search("x", "tenant-1", 10)).thenReturn(List.of(result1, result2, result3));

        List<SearchResult> results = service.search("x", "tenant-1", 10);

        assertEquals("High Score", results.get(0).getTitle());
        assertEquals("Mid Score", results.get(1).getTitle());
        assertEquals("Low Score", results.get(2).getTitle());
    }

    @Test
    void search_worksWithNoProviders() {
        service = new GlobalSearchService(Optional.empty());

        List<SearchResult> results = service.search("anything", "tenant-1", 10);

        assertTrue(results.isEmpty());
    }
}
