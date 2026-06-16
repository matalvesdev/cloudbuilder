package com.cloudbuilder.provision.infrastructure.web;

import com.cloudbuilder.provision.application.dto.CanvasDesign;
import com.cloudbuilder.provision.application.dto.GeneratedCode;
import com.cloudbuilder.provision.application.port.CanvasDesignFetcher;
import com.cloudbuilder.provision.domain.service.CodeGeneratorService;
import com.cloudbuilder.shared.monitoring.CustomMetrics;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/canvases/{canvasId}/generate")
@PreAuthorize("isAuthenticated()")
public class CodeGeneratorController {

    private final CanvasDesignFetcher canvasDesignFetcher;
    private final CodeGeneratorService codeGeneratorService;
    private final CustomMetrics customMetrics;

    public CodeGeneratorController(CanvasDesignFetcher canvasDesignFetcher,
                                   CodeGeneratorService codeGeneratorService,
                                   CustomMetrics customMetrics) {
        this.canvasDesignFetcher = canvasDesignFetcher;
        this.codeGeneratorService = codeGeneratorService;
        this.customMetrics = customMetrics;
    }

    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<GeneratedCode> generateCode(
            @PathVariable UUID canvasId,
            @RequestParam(name = "engine", defaultValue = "terraform") String engine) {

        if (!"terraform".equals(engine) && !"opentofu".equals(engine)) {
            return ResponseEntity.badRequest().build();
        }

        CanvasDesign design = canvasDesignFetcher.fetchCanvasDesign(canvasId);

        String provider = determineProvider(design);

        GeneratedCode generatedCode = codeGeneratorService.generateCode(design, provider, engine);
        customMetrics.recordCodeGenerated();

        return ResponseEntity.ok(generatedCode);
    }

    private String determineProvider(CanvasDesign design) {
        return design.nodes().stream()
            .map(n -> n.provider())
            .filter(p -> !"unknown".equals(p))
            .findFirst()
            .orElse("aws");
    }
}
