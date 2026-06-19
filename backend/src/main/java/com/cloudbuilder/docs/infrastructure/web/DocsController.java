package com.cloudbuilder.docs.infrastructure.web;

import com.cloudbuilder.docs.application.dto.DocContent;
import com.cloudbuilder.docs.application.dto.DocTreeItem;
import com.cloudbuilder.docs.domain.service.AutoDocService;
import com.cloudbuilder.docs.domain.service.DocScannerService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/docs")
@PreAuthorize("isAuthenticated()")
public class DocsController {

    private static final String DEFAULT_DOCS_PATH = "docs";

    private final DocScannerService docScannerService;
    private final AutoDocService autoDocService;

    public DocsController(DocScannerService docScannerService, AutoDocService autoDocService) {
        this.docScannerService = docScannerService;
        this.autoDocService = autoDocService;
    }

    /**
     * Returns the documentation tree (directories + .md files).
     */
    @GetMapping("/tree")
    public ResponseEntity<List<DocTreeItem>> getTree() {
        List<DocTreeItem> tree = docScannerService.scanDirectory(DEFAULT_DOCS_PATH);
        return ResponseEntity.ok(tree);
    }

    /**
     * Returns the content of a specific documentation file.
     */
    @GetMapping("/content")
    public ResponseEntity<DocContent> getContent(@RequestParam String path) {
        return docScannerService.readFile(DEFAULT_DOCS_PATH, path)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Scans the docs directory for new/changed .md files.
     */
    @PostMapping("/scan")
    public ResponseEntity<Map<String, Integer>> scanDirectory() {
        List<DocTreeItem> tree = docScannerService.scanDirectory(DEFAULT_DOCS_PATH);
        int count = countFiles(tree);
        return ResponseEntity.ok(Map.of("scanned", count));
    }

    /**
     * Imports an uploaded .md file into the docs directory.
     */
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocContent> importFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty() || !file.getOriginalFilename().endsWith(".md")) {
            return ResponseEntity.badRequest().build();
        }

        try {
            String fileName = file.getOriginalFilename();
            byte[] content = file.getBytes();
            return docScannerService.importFile(DEFAULT_DOCS_PATH, fileName, content)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.internalServerError().build());
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Searches documentation content.
     */
    @GetMapping("/search")
    public ResponseEntity<List<DocTreeItem>> search(@RequestParam String q) {
        if (q == null || q.trim().isEmpty()) {
            return ResponseEntity.ok(List.of());
        }
        List<DocTreeItem> results = docScannerService.searchDocs(DEFAULT_DOCS_PATH, q);
        return ResponseEntity.ok(results);
    }

    /**
     * Generates an ADR draft from a canvas design.
     */
    @PostMapping("/generate")
    public ResponseEntity<DocContent> generateDoc(@RequestBody Map<String, String> request) {
        String canvasId = request.get("canvasId");
        String canvasName = request.getOrDefault("canvasName", "Design #" + canvasId);
        String description = request.get("description");

        if (canvasId == null) {
            return ResponseEntity.badRequest().build();
        }

        // In production, generate a unique ADR number from the database
        int adrNumber = 10; // Start from 10 (after the 9 ADRs)
        DocContent doc = autoDocService.generateAdrDraft(canvasName, description, adrNumber);
        return ResponseEntity.ok(doc);
    }

    /**
     * Lists stale documentation (docs that may not reflect current system state).
     */
    @GetMapping("/stale")
    public ResponseEntity<List<Map<String, String>>> getStaleDocs() {
        // Placeholder — would compare doc content hashes with current canvas/environment state
        return ResponseEntity.ok(List.of());
    }

    private int countFiles(List<DocTreeItem> items) {
        int count = 0;
        for (DocTreeItem item : items) {
            if ("file".equals(item.getType())) {
                count++;
            }
            if (item.getChildren() != null) {
                count += countFiles(item.getChildren());
            }
        }
        return count;
    }
}
