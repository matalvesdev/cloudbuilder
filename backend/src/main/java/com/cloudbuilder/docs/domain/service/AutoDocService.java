package com.cloudbuilder.docs.domain.service;

import com.cloudbuilder.design.domain.model.Canvas;
import com.cloudbuilder.design.domain.model.CanvasEdge;
import com.cloudbuilder.design.domain.model.CanvasNode;
import com.cloudbuilder.design.domain.model.KnowledgeGraph;
import com.cloudbuilder.design.domain.port.CanvasRepository;
import com.cloudbuilder.docs.application.dto.DocContent;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AutoDocService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final CanvasRepository canvasRepository;

    public AutoDocService(CanvasRepository canvasRepository) {
        this.canvasRepository = canvasRepository;
    }

    /**
     * Generates a draft ADR document with real Mermaid diagrams from canvas data.
     */
    public DocContent generateAdrDraft(String canvasName, String description, int adrNumber) {
        String today = LocalDate.now().format(DATE_FMT);
        String title = canvasName.replaceAll("[^a-zA-Z0-9\\s-]", "").trim().replace(" ", "-").toLowerCase();

        StringBuilder sb = new StringBuilder();
        sb.append("# ADR-").append(String.format("%03d", adrNumber)).append(": ").append(canvasName).append("\n\n");
        sb.append("## Status\n\n");
        sb.append("Rascunho — ").append(today).append("\n\n");
        sb.append("## Contexto\n\n");
        if (description != null && !description.isBlank()) {
            sb.append(description).append("\n\n");
        } else {
            sb.append("Design gerado a partir do canvas \"").append(canvasName).append("\". ");
            sb.append("Esta documentação foi gerada automaticamente e precisa de revisão.\n\n");
        }
        sb.append("## Decisão\n\n");
        sb.append("<!-- Descreva aqui as decisões técnicas tomadas neste design -->\n\n");
        sb.append("## Diagrama\n\n");
        sb.append("```mermaid\n");
        sb.append("graph TD\n");
        sb.append("    %% Auto-generated from canvas — revisar e completar\n");
        sb.append("    subgraph \"").append(canvasName).append("\"\n");
        sb.append("    end\n");
        sb.append("```\n\n");
        sb.append("## Componentes\n\n");
        sb.append("<!-- Lista de componentes envolvidos -->\n\n");
        sb.append("| Componente | Tipo | Provedor |\n");
        sb.append("|------------|------|----------|\n");
        sb.append("| _(auto-preenchido)_ | — | — |\n\n");
        sb.append("## Consequências\n\n");
        sb.append("<!-- Impactos positivos e negativos desta decisão -->\n\n");
        sb.append("- **Positivas**: (pendente)\n");
        sb.append("- **Negativas**: (pendente)\n");
        sb.append("- **Riscos**: (pendente)\n");

        String content = sb.toString();
        String fileName = "adr-" + String.format("%03d", adrNumber) + "-" + title + ".md";

        return new DocContent("docs/architecture/" + fileName, "ADR-" + String.format("%03d", adrNumber) + ": " + canvasName, content);
    }

    /**
     * Generates a full architecture document with real Mermaid diagrams from a canvas.
     */
    public DocContent generateArchitectureDoc(String canvasId) {
        Optional<Canvas> canvasOpt = canvasRepository.findById(canvasId);
        if (canvasOpt.isEmpty()) {
            return new DocContent("docs/architecture/unknown.md", "Unknown", "# Canvas not found\n");
        }

        Canvas canvas = canvasOpt.get();
        List<CanvasNode> nodes = canvas.getCanvasNodes();
        List<CanvasEdge> edges = canvas.getCanvasEdges();

        StringBuilder sb = new StringBuilder();
        sb.append("# ").append(canvas.getName()).append(" — Architecture\n\n");

        if (canvas.getDescription() != null && !canvas.getDescription().isBlank()) {
            sb.append(canvas.getDescription()).append("\n\n");
        }

        // Component summary
        sb.append("## Components (").append(nodes.size()).append(")\n\n");
        sb.append("| ID | Component | Connections |\n");
        sb.append("|----|-----------|-------------|\n");
        for (CanvasNode node : nodes) {
            long connCount = edges.stream()
                .filter(e -> e.getSourceNodeId().equals(node.getId()) || e.getTargetNodeId().equals(node.getId()))
                .count();
            sb.append("| ").append(node.getId()).append(" | ")
              .append(node.getComponentDefinitionId()).append(" | ")
              .append(connCount).append(" |\n");
        }
        sb.append("\n");

        // Mermaid diagram
        sb.append("## Architecture Diagram\n\n");
        sb.append(generateMermaidDiagram(canvas.getName(), nodes, edges));
        sb.append("\n");

        // Connection details
        sb.append("## Connections (").append(edges.size()).append(")\n\n");
        sb.append("| From | To | Type |\n");
        sb.append("|------|----|------|\n");
        for (CanvasEdge edge : edges) {
            sb.append("| ").append(edge.getSourceNodeId()).append(" | ")
              .append(edge.getTargetNodeId()).append(" | ")
              .append(edge.getEdgeType()).append(" |\n");
        }

        String fileName = "architecture-" + canvasId + ".md";
        return new DocContent("docs/architecture/" + fileName, canvas.getName() + " — Architecture", sb.toString());
    }

    /**
     * Generates a standalone Mermaid diagram from canvas nodes and edges.
     */
    public String generateMermaidDiagram(String canvasName, List<CanvasNode> nodes, List<CanvasEdge> edges) {
        StringBuilder sb = new StringBuilder();
        sb.append("```mermaid\n");
        sb.append("flowchart TB\n\n");

        // Group nodes by component type (extract provider prefix from componentDefinitionId)
        Map<String, List<CanvasNode>> byProvider = nodes.stream()
            .collect(Collectors.groupingBy(n -> extractProvider(n.getComponentDefinitionId())));

        // Subgraph per provider
        for (var entry : byProvider.entrySet()) {
            sb.append("    subgraph ").append(sanitizeId(entry.getKey())).append("[").append(entry.getKey()).append("]\n");
            for (CanvasNode node : entry.getValue()) {
                String nodeId = sanitizeId(node.getId());
                String label = node.getComponentDefinitionId() != null ? node.getComponentDefinitionId() : node.getId();
                sb.append("        ").append(nodeId).append("[\"").append(label).append("\"]\n");
            }
            sb.append("    end\n\n");
        }

        // Edges
        for (CanvasEdge edge : edges) {
            String source = sanitizeId(edge.getSourceNodeId());
            String target = sanitizeId(edge.getTargetNodeId());
            String edgeType = edge.getEdgeType();
            if ("animated".equals(edgeType)) {
                sb.append("    ").append(source).append(" -.-> ").append(target).append("\n");
            } else if ("dashed".equals(edgeType)) {
                sb.append("    ").append(source).append(" -. ").append(target).append("\n");
            } else {
                sb.append("    ").append(source).append(" --> ").append(target).append("\n");
            }
        }

        sb.append("```");
        return sb.toString();
    }

    /**
     * Generates AI context from canvas for LLM consumption.
     */
    public String generateAiContext(String canvasId) {
        Optional<Canvas> canvasOpt = canvasRepository.findById(canvasId);
        if (canvasOpt.isEmpty()) return "Canvas not found.";

        Canvas canvas = canvasOpt.get();
        List<CanvasNode> nodes = canvas.getCanvasNodes();
        List<CanvasEdge> edges = canvas.getCanvasEdges();

        StringBuilder sb = new StringBuilder();
        sb.append("Architecture: ").append(canvas.getName()).append("\n");
        sb.append("Components: ").append(nodes.size()).append("\n");
        sb.append("Connections: ").append(edges.size()).append("\n\n");

        sb.append("Components:\n");
        for (CanvasNode node : nodes) {
            sb.append("- ").append(node.getComponentDefinitionId())
              .append(" (").append(node.getId()).append(")\n");
        }

        sb.append("\nConnections:\n");
        for (CanvasEdge edge : edges) {
            sb.append("- ").append(edge.getSourceNodeId())
              .append(" -> ").append(edge.getTargetNodeId())
              .append(" [").append(edge.getEdgeType()).append("]\n");
        }

        return sb.toString();
    }

    /**
     * Suggests which docs may be stale based on entity changes.
     */
    public boolean isDocStale(String docContent, String currentStateHash) {
        if (docContent == null || currentStateHash == null) return false;
        return !docContent.contains(currentStateHash);
    }

    private String extractProvider(String componentDefinitionId) {
        if (componentDefinitionId == null) return "unknown";
        String[] parts = componentDefinitionId.split("-");
        return parts.length > 0 ? parts[0] : "unknown";
    }

    private String sanitizeId(String id) {
        return id.replaceAll("[^a-zA-Z0-9]", "_");
    }

    /**
     * Generates a README.md for a canvas project.
     */
    public DocContent generateReadme(String canvasId) {
        Optional<Canvas> canvasOpt = canvasRepository.findById(canvasId);
        if (canvasOpt.isEmpty()) {
            return new DocContent("README.md", "README", "# Project\n\nCanvas not found.\n");
        }

        Canvas canvas = canvasOpt.get();
        List<CanvasNode> nodes = canvas.getCanvasNodes();
        List<CanvasEdge> edges = canvas.getCanvasEdges();

        StringBuilder sb = new StringBuilder();
        sb.append("# ").append(canvas.getName()).append("\n\n");
        if (canvas.getDescription() != null && !canvas.getDescription().isBlank()) {
            sb.append(canvas.getDescription()).append("\n\n");
        }

        sb.append("## Architecture\n\n");
        sb.append(generateMermaidDiagram(canvas.getName(), nodes, edges));
        sb.append("\n\n");

        sb.append("## Components\n\n");
        sb.append("| Component | Provider | Connections |\n");
        sb.append("|-----------|----------|-------------|\n");
        for (CanvasNode node : nodes) {
            long conns = edges.stream()
                .filter(e -> e.getSourceNodeId().equals(node.getId()) || e.getTargetNodeId().equals(node.getId()))
                .count();
            String provider = extractProvider(node.getComponentDefinitionId());
            sb.append("| ").append(node.getComponentDefinitionId()).append(" | ")
              .append(provider).append(" | ").append(conns).append(" |\n");
        }

        sb.append("\n## Getting Started\n\n");
        sb.append("1. Clone the repository\n");
        sb.append("2. Configure cloud credentials\n");
        sb.append("3. Run `terraform init && terraform plan`\n");
        sb.append("4. Review the plan and apply\n\n");

        sb.append("## Infrastructure\n\n");
        sb.append("This project uses CloudBuilder for infrastructure management.\n");
        sb.append("Components: ").append(nodes.size()).append(" | Connections: ").append(edges.size()).append("\n");

        return new DocContent("README.md", canvas.getName(), sb.toString());
    }

    /**
     * Generates C4 model diagrams for a canvas.
     */
    public DocContent generateC4(String canvasId) {
        Optional<Canvas> canvasOpt = canvasRepository.findById(canvasId);
        if (canvasOpt.isEmpty()) {
            return new DocContent("architecture/c4.md", "C4 Model", "# C4 Model\n\nCanvas not found.\n");
        }

        Canvas canvas = canvasOpt.get();
        List<CanvasNode> nodes = canvas.getCanvasNodes();

        StringBuilder sb = new StringBuilder();
        sb.append("# C4 Architecture Model — ").append(canvas.getName()).append("\n\n");

        // Level 1: System Context
        sb.append("## Level 1: System Context\n\n");
        sb.append("```mermaid\ngraph TB\n");
        sb.append("    User([User])\n");
        sb.append("    System[").append(canvas.getName()).append("]\n");
        sb.append("    User --> System\n");
        sb.append("```\n\n");

        // Level 2: Container
        sb.append("## Level 2: Container\n\n");
        sb.append("```mermaid\ngraph TB\n");
        Map<String, List<CanvasNode>> byProvider = nodes.stream()
            .collect(Collectors.groupingBy(n -> extractProvider(n.getComponentDefinitionId())));
        for (var entry : byProvider.entrySet()) {
            sb.append("    subgraph ").append(sanitizeId(entry.getKey())).append("[").append(entry.getKey()).append("]\n");
            for (CanvasNode node : entry.getValue()) {
                sb.append("        ").append(sanitizeId(node.getId())).append("[\"").append(node.getComponentDefinitionId()).append("\"]\n");
            }
            sb.append("    end\n");
        }
        sb.append("```\n\n");

        // Level 3: Component
        sb.append("## Level 3: Component\n\n");
        sb.append("| Component | Type | Provider |\n");
        sb.append("|-----------|------|----------|\n");
        for (CanvasNode node : nodes) {
            sb.append("| ").append(node.getComponentDefinitionId()).append(" | Component | ")
              .append(extractProvider(node.getComponentDefinitionId())).append(" |\n");
        }

        return new DocContent("architecture/c4.md", canvas.getName() + " — C4 Model", sb.toString());
    }
}
