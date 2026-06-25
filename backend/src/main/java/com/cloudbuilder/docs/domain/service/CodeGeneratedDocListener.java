package com.cloudbuilder.docs.domain.service;

import com.cloudbuilder.docs.application.dto.DocContent;
import com.cloudbuilder.docs.application.dto.DocTreeItem;
import com.cloudbuilder.docs.infrastructure.web.DocsController;
import com.cloudbuilder.provision.domain.event.CodeGeneratedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

/**
 * Listens for {@link CodeGeneratedEvent} and automatically generates
 * an ADR draft documentation for the associated canvas design.
 * <p>
 * This bridges Provision → Docs, implementing ADR-009 GAP-E:
 * auto-generation trigger after code generation.
 */
@Service
public class CodeGeneratedDocListener {

    private static final Logger log = LoggerFactory.getLogger(CodeGeneratedDocListener.class);

    private static final String DOCS_ARCH_PATH = "docs/architecture";

    private final AutoDocService autoDocService;
    private final DocScannerService docScannerService;

    public CodeGeneratedDocListener(AutoDocService autoDocService,
                                     DocScannerService docScannerService) {
        this.autoDocService = autoDocService;
        this.docScannerService = docScannerService;
    }

    /**
     * Triggered after code generation completes successfully.
     * Generates an ADR draft from the canvas and saves it to docs/architecture/.
     */
    @EventListener
    public void onCodeGenerated(CodeGeneratedEvent event) {
        log.info("Auto-generating ADR for canvas: {} ({})", event.canvasName(), event.canvasId());

        try {
            int nextAdrNumber = resolveNextAdrNumber();
            DocContent draft = autoDocService.generateAdrDraft(
                    event.canvasName(), null, nextAdrNumber);

            String savePath = "architecture/" + draft.getPath().replace("docs/", "");
            Optional<DocContent> saved = docScannerService.saveFile(
                    DOCS_ARCH_PATH, savePath, draft.getContent());

            if (saved.isPresent()) {
                log.info("Auto-generated ADR-{} for canvas '{}': {}",
                        String.format("%03d", nextAdrNumber),
                        event.canvasName(), savePath);
            } else {
                log.warn("Failed to save auto-generated ADR for canvas: {}", event.canvasName());
            }
        } catch (IOException e) {
            log.warn("I/O error during auto-generated ADR for canvas '{}': {}",
                    event.canvasName(), e.getMessage());
        } catch (Exception e) {
            log.warn("Unexpected error during auto-generated ADR for canvas '{}': {}",
                    event.canvasName(), e.getMessage());
        }
    }

    /**
     * Scans existing ADR files to determine the next available ADR number.
     * Uses the same logic as {@link DocsController#resolveNextAdrNumber()}
     * but with the injected service instead.
     */
    private int resolveNextAdrNumber() {
        try {
            List<DocTreeItem> tree = docScannerService.scanDirectory(DOCS_ARCH_PATH);
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
        } catch (Exception e) {
            return 1;
        }
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
}
