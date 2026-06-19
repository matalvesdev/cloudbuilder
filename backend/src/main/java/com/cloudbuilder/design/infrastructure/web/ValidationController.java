package com.cloudbuilder.design.infrastructure.web;

import com.cloudbuilder.design.application.dto.ValidationReport;
import com.cloudbuilder.design.domain.service.ValidationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/canvases/{canvasId}/validate")
public class ValidationController {

    private final ValidationService validationService;

    public ValidationController(ValidationService validationService) {
        this.validationService = validationService;
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ValidationReport> validateCanvas(@PathVariable String canvasId) {
        ValidationReport report = validationService.validateCanvas(canvasId);
        return ResponseEntity.ok(report);
    }
}
