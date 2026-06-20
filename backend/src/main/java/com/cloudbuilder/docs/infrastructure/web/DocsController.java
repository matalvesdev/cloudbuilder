package com.cloudbuilder.docs.infrastructure.web;

import com.cloudbuilder.docs.application.dto.DocContent;
import com.cloudbuilder.docs.application.dto.DocLinkRequest;
import com.cloudbuilder.docs.application.dto.DocTreeItem;
import com.cloudbuilder.docs.domain.model.DocAutoLink;
import com.cloudbuilder.docs.domain.service.AutoDocService;
import com.cloudbuilder.docs.domain.service.DocAutoLinkService;
import com.cloudbuilder.docs.domain.service.DocScannerService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/docs")
@PreAuthorize("isAuthenticated()")
public class DocsController {

    private static final String DEFAULT_DOCS_PATH = "docs";

    private final DocScannerService docScannerService;
    private final AutoDocService autoDocService;
    private final DocAutoLinkService docAutoLinkService;

    public DocsController(DocScannerService docScannerService, AutoDocService autoDocService,
                          DocAutoLinkService docAutoLinkService) {
        this.docScannerService = docScannerService;
        this.autoDocService = autoDocService;
        this.docAutoLinkService = docAutoLinkService;
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
     * Saves (creates or updates) a documentation file.
     */
    @PutMapping("/content")
    public ResponseEntity<DocContent> saveContent(@RequestBody DocContent docContent) {
        if (docContent.getPath() == null || docContent.getPath().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        try {
            return docScannerService.saveFile(DEFAULT_DOCS_PATH, docContent.getPath(), docContent.getContent())
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.internalServerError().build());
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
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

    // ── Cross-module links ──

    /**
     * Returns all links for a given doc path.
     */
    @GetMapping("/links")
    public ResponseEntity<List<DocAutoLink>> getLinksForDoc(@RequestParam String path) {
        return ResponseEntity.ok(docAutoLinkService.getLinksForDoc(path));
    }

    /**
     * Creates a new cross-module link between a doc and an entity.
     */
    @PostMapping("/links")
    public ResponseEntity<DocAutoLink> createLink(@RequestBody DocLinkRequest request) {
        if (request.getDocPath() == null || request.getEntityType() == null || request.getEntityId() == null) {
            return ResponseEntity.badRequest().build();
        }
        DocAutoLink link = docAutoLinkService.createLink(
                request.getDocPath(), request.getEntityType(), request.getEntityId(),
                request.getTenantId() != null ? request.getTenantId() : "default"
        );
        return ResponseEntity.ok(link);
    }

    /**
     * Deletes a cross-module link.
     */
    @DeleteMapping("/links/{id}")
    public ResponseEntity<Void> deleteLink(@PathVariable String id) {
        docAutoLinkService.deleteLink(id);
        return ResponseEntity.noContent().build();
    }

    // ── ADR generation ──

    /**
     * Generates an ADR draft from a canvas design and optionally saves it.
     */
    @PostMapping("/generate")
    public ResponseEntity<DocContent> generateDoc(@RequestBody Map<String, String> request) {
        String canvasId = request.get("canvasId");
        String canvasName = request.getOrDefault("canvasName", "Design #" + canvasId);
        String description = request.get("description");

        if (canvasId == null) {
            return ResponseEntity.badRequest().build();
        }

        // Determine next ADR number from existing ADR files
        int adrNumber = resolveNextAdrNumber();

        DocContent doc = autoDocService.generateAdrDraft(canvasName, description, adrNumber);

        // Save the generated ADR to the docs/architecture directory
        try {
            Optional<DocContent> saved = docScannerService.saveFile(
                    DEFAULT_DOCS_PATH, "architecture/" + doc.getPath().replace("docs/", ""), doc.getContent()
            );
            if (saved.isPresent()) {
                doc = saved.get();
                doc.setPath("architecture/" + doc.getPath().replace("docs/", ""));
            }
        } catch (IOException e) {
            // Return draft anyway even if save fails
        }

        return ResponseEntity.ok(doc);
    }

    /**
     * Lists stale documentation (docs whose checksum differs from the last known state).
     */
    @GetMapping("/stale")
    public ResponseEntity<List<Map<String, String>>> getStaleDocs() {
        List<DocTreeItem> tree = docScannerService.scanDirectory(DEFAULT_DOCS_PATH);
        List<Map<String, String>> staleDocs = new java.util.ArrayList<>();

        for (DocTreeItem item : flattenTree(tree)) {
            if ("file".equals(item.getType())) {
                Optional<DocContent> doc = docScannerService.readFile(DEFAULT_DOCS_PATH, item.getPath());
                doc.ifPresent(d -> {
                    // A doc is considered stale if it hasn't been modified in 30+ days
                    try {
                        if (d.getLastModified() != null) {
                            java.time.Instant modified = java.time.Instant.parse(d.getLastModified());
                            java.time.Instant thirtyDaysAgo = java.time.Instant.now().minus(java.time.Duration.ofDays(30));
                            if (modified.isBefore(thirtyDaysAgo)) {
                                staleDocs.add(Map.of(
                                        "path", d.getPath(),
                                        "title", d.getTitle() != null ? d.getTitle() : d.getPath(),
                                        "reason", "Nao modificado ha mais de 30 dias",
                                        "lastModified", d.getLastModified()
                                ));
                            }
                        }
                    } catch (Exception ignored) {
                        // Skip if date parsing fails
                    }
                });
            }
        }

        return ResponseEntity.ok(staleDocs);
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

    private List<DocTreeItem> flattenTree(List<DocTreeItem> items) {
        List<DocTreeItem> flat = new java.util.ArrayList<>();
        for (DocTreeItem item : items) {
            flat.add(item);
            if (item.getChildren() != null) {
                flat.addAll(flattenTree(item.getChildren()));
            }
        }
        return flat;
    }

    private int resolveNextAdrNumber() {
        List<DocTreeItem> tree = docScannerService.scanDirectory(DEFAULT_DOCS_PATH + "/architecture");
        int maxAdr = 0;
        for (DocTreeItem item : flattenTree(tree)) {
            if ("file".equals(item.getType()) && item.getName().startsWith("adr-")) {
                try {
                    String numPart = item.getName().substring(4, 7);
                    int num = Integer.parseInt(numPart);
                    if (num > maxAdr) maxAdr = num;
                } catch (Exception ignored) {}
            }
        }
        return maxAdr + 1;
    }
}
