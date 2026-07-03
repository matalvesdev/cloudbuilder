package com.cloudbuilder.design.infrastructure.web;

import com.cloudbuilder.design.domain.model.KnowledgeGraph;
import com.cloudbuilder.design.domain.service.KnowledgeGraphService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/canvases/{canvasId}/knowledge-graph")
@PreAuthorize("isAuthenticated()")
public class KnowledgeGraphController {

    private final KnowledgeGraphService knowledgeGraphService;

    public KnowledgeGraphController(KnowledgeGraphService knowledgeGraphService) {
        this.knowledgeGraphService = knowledgeGraphService;
    }

    /** Get the full knowledge graph for a canvas. */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getGraph(@PathVariable String canvasId) {
        KnowledgeGraph graph = knowledgeGraphService.buildGraph(canvasId);
        return ResponseEntity.ok(graph.toMap());
    }

    /** Get AI context summary for a canvas. */
    @GetMapping("/ai-context")
    public ResponseEntity<Map<String, String>> getAiContext(@PathVariable String canvasId) {
        String context = knowledgeGraphService.buildAiContext(canvasId);
        return ResponseEntity.ok(Map.of("context", context));
    }

    /** Analyze impact of removing a node. */
    @GetMapping("/impact/{nodeId}")
    public ResponseEntity<Map<String, Object>> analyzeImpact(
            @PathVariable String canvasId,
            @PathVariable String nodeId) {
        Map<String, Object> impact = knowledgeGraphService.analyzeImpact(canvasId, nodeId);
        return ResponseEntity.ok(impact);
    }
}
