package com.cloudbuilder.provision.infrastructure.web;

import com.cloudbuilder.provision.application.dto.CanvasDesign;
import com.cloudbuilder.provision.application.dto.GeneratedCode;
import com.cloudbuilder.provision.application.port.CanvasDesignFetcher;
import com.cloudbuilder.provision.domain.model.DeployPlan;
import com.cloudbuilder.provision.domain.service.CodeGeneratorService;
import com.cloudbuilder.provision.domain.service.DeployPlanService;
import com.cloudbuilder.shared.monitoring.CustomMetrics;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/canvases/{canvasId}/generate")
@PreAuthorize("isAuthenticated()")
public class CodeGeneratorController {

    private final CanvasDesignFetcher canvasDesignFetcher;
    private final CodeGeneratorService codeGeneratorService;
    private final CustomMetrics customMetrics;
    private final DeployPlanService deployPlanService;

    public CodeGeneratorController(CanvasDesignFetcher canvasDesignFetcher,
                                   CodeGeneratorService codeGeneratorService,
                                   CustomMetrics customMetrics,
                                   DeployPlanService deployPlanService) {
        this.canvasDesignFetcher = canvasDesignFetcher;
        this.codeGeneratorService = codeGeneratorService;
        this.customMetrics = customMetrics;
        this.deployPlanService = deployPlanService;
    }

    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<GeneratedCode> generateCode(
            @PathVariable String canvasId,
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

    /* ─── Deploy Plan (Preview Workflow) ──────────────────────────── */

    @PostMapping("/plan")
    public ResponseEntity<DeployPlan> createPlan(@RequestBody DeployPlan plan) {
        return ResponseEntity.ok(deployPlanService.create(plan));
    }

    @GetMapping("/plan/{planId}")
    public ResponseEntity<DeployPlan> getPlan(@PathVariable String canvasId, @PathVariable String planId) {
        var plan = deployPlanService.findById(planId);
        if (plan == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(plan);
    }

    @GetMapping("/plans")
    public ResponseEntity<List<DeployPlan>> listPlans(@PathVariable String canvasId) {
        return ResponseEntity.ok(deployPlanService.findByCanvas(canvasId));
    }

    @PostMapping("/plan/{planId}/apply")
    public ResponseEntity<DeployPlan> applyPlan(@PathVariable String canvasId, @PathVariable String planId) {
        var plan = deployPlanService.markApplied(planId);
        if (plan == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(plan);
    }

    @PostMapping("/plan/{planId}/fail")
    public ResponseEntity<DeployPlan> failPlan(@PathVariable String canvasId, @PathVariable String planId) {
        var plan = deployPlanService.markFailed(planId);
        if (plan == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(plan);
    }
}
