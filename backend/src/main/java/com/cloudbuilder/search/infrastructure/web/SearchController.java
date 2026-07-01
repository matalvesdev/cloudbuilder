package com.cloudbuilder.search.infrastructure.web;

import com.cloudbuilder.search.domain.model.SearchResult;
import com.cloudbuilder.search.domain.service.GlobalSearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/search")
@PreAuthorize("isAuthenticated()")
public class SearchController {

    private final GlobalSearchService globalSearchService;

    public SearchController(GlobalSearchService globalSearchService) {
        this.globalSearchService = globalSearchService;
    }

    @GetMapping
    public ResponseEntity<List<SearchResult>> search(
            @RequestParam String q,
            @RequestHeader(value = "X-Tenant-Id", defaultValue = "default") String tenantId,
            @RequestParam(defaultValue = "20") int maxResults) {
        return ResponseEntity.ok(globalSearchService.search(q, tenantId, maxResults));
    }

    @GetMapping("/grouped")
    public ResponseEntity<List<SearchResult>> searchGrouped(
            @RequestParam String q,
            @RequestHeader(value = "X-Tenant-Id", defaultValue = "default") String tenantId,
            @RequestParam(defaultValue = "40") int maxResults) {
        return ResponseEntity.ok(globalSearchService.searchGrouped(q, tenantId, maxResults));
    }
}
