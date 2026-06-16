package com.cloudbuilder.provision.domain.service;

import com.cloudbuilder.provision.application.dto.CanvasDesign;
import com.cloudbuilder.provision.domain.port.TerraformTemplateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class CodeGeneratorServiceTest {

    @Mock
    private TerraformTemplateRepository templateRepository;

    private CodeGeneratorService codeGeneratorService;

    @BeforeEach
    void setUp() {
        codeGeneratorService = new CodeGeneratorService(templateRepository);
    }

    @Test
    void generateCode_WithValidDesign_ShouldReturnNonEmptyCode() {
        var node = new CanvasDesign.DesignNode(
            "node-1", "vpc", "aws",
            Map.of("cidr", "10.0.0.0/16", "name", "main-vpc"),
            0.0, 0.0
        );
        var design = new CanvasDesign(UUID.randomUUID(), "test-design", List.of(node), List.of());

        var result = codeGeneratorService.generateCode(design, "aws", "terraform");

        assertNotNull(result);
        assertFalse(result.files().isEmpty());
    }

    @Test
    void generateCode_WithEmptyDesign_ShouldReturnEmptyCode() {
        var design = new CanvasDesign(UUID.randomUUID(), "empty", List.of(), List.of());

        var result = codeGeneratorService.generateCode(design, "aws", "terraform");

        assertNotNull(result);
    }
}
