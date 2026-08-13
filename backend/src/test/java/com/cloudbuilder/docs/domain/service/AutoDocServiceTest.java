package com.cloudbuilder.docs.domain.service;

import com.cloudbuilder.design.domain.port.CanvasRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class AutoDocServiceTest {

    @Mock
    private CanvasRepository canvasRepository;

    private AutoDocService autoDocService;

    @BeforeEach
    void setUp() {
        autoDocService = new AutoDocService(canvasRepository);
    }

    @Test
    void generateAdrDraft_ShouldIncludeTitleAndContext() {
        var result = autoDocService.generateAdrDraft("My Canvas Design", "Description text", 1);

        assertNotNull(result);
        assertTrue(result.getPath().contains("adr-001"));
        assertTrue(result.getTitle().contains("My Canvas Design"));
        assertTrue(result.getContent().contains("ADR-001"));
        assertTrue(result.getContent().contains("Description text"));
    }

    @Test
    void generateAdrDraft_WithNoDescription_ShouldUseDefault() {
        var result = autoDocService.generateAdrDraft("Test Canvas", null, 5);

        assertTrue(result.getContent().contains("gerada automaticamente"));
        assertTrue(result.getPath().endsWith(".md"));
    }

    @Test
    void generateAdrDraft_WithBlankDescription_ShouldUseDefault() {
        var result = autoDocService.generateAdrDraft("Test", "   ", 10);

        assertTrue(result.getContent().contains("gerada automaticamente"));
    }

    @Test
    void generateAdrDraft_ShouldSanitizeTitleInFileName() {
        var result = autoDocService.generateAdrDraft("My @#$ Canvas!", "", 2);

        assertFalse(result.getPath().contains("@"));
        assertFalse(result.getPath().contains("#"));
        assertFalse(result.getPath().contains("$"));
    }

    @Test
    void generateAdrDraft_ShouldIncludeMermaidDiagram() {
        var result = autoDocService.generateAdrDraft("Infra Design", "Test", 3);

        assertTrue(result.getContent().contains("```mermaid"));
        assertTrue(result.getContent().contains("Infra Design"));
    }

    @Test
    void generateAdrDraft_ShouldIncludeComponentTable() {
        var result = autoDocService.generateAdrDraft("Design", "Test", 4);

        assertTrue(result.getContent().contains("| Componente |"));
        assertTrue(result.getContent().contains("|------------|"));
    }

    @Test
    void generateAdrDraft_ShouldIncludeConsequences() {
        var result = autoDocService.generateAdrDraft("Design", "Test", 7);

        assertTrue(result.getContent().contains("Positivas"));
        assertTrue(result.getContent().contains("Negativas"));
        assertTrue(result.getContent().contains("Riscos"));
    }

    @Test
    void generateAdrDraft_ShouldFormatAdrNumberWithLeadingZeros() {
        var result = autoDocService.generateAdrDraft("Test", "", 42);

        assertTrue(result.getPath().contains("adr-042"));
    }

    @Test
    void isDocStale_WhenHashNotFound_ShouldReturnTrue() {
        assertTrue(autoDocService.isDocStale("doc with some content", "nonexistent-hash"));
    }

    @Test
    void isDocStale_WhenHashFound_ShouldReturnFalse() {
        assertFalse(autoDocService.isDocStale("doc with hash-123 content", "hash-123"));
    }

    @Test
    void isDocStale_WhenContentNull_ShouldReturnFalse() {
        assertFalse(autoDocService.isDocStale(null, "hash"));
    }

    @Test
    void isDocStale_WhenHashNull_ShouldReturnFalse() {
        assertFalse(autoDocService.isDocStale("content", null));
    }
}
