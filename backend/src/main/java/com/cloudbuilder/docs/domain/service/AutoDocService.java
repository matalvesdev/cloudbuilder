package com.cloudbuilder.docs.domain.service;

import com.cloudbuilder.docs.application.dto.DocContent;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
public class AutoDocService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * Generates a draft ADR document based on a canvas design.
     * In a full implementation, this would inspect canvas nodes, edges,
     * and component definitions to produce a meaningful architecture document.
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

        DocContent doc = new DocContent("docs/architecture/" + fileName, "ADR-" + String.format("%03d", adrNumber) + ": " + canvasName, content);
        return doc;
    }

    /**
     * Suggests which docs may be stale based on entity changes.
     */
    public boolean isDocStale(String docContent, String currentStateHash) {
        if (docContent == null || currentStateHash == null) return false;
        return !docContent.contains(currentStateHash);
    }
}
