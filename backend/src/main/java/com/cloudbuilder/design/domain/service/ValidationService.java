package com.cloudbuilder.design.domain.service;

import com.cloudbuilder.design.application.dto.ValidationReport;
import com.cloudbuilder.design.domain.model.Canvas;
import com.cloudbuilder.design.domain.model.CanvasEdge;
import com.cloudbuilder.design.domain.model.CanvasNode;
import com.cloudbuilder.design.domain.port.CanvasRepository;
import com.cloudbuilder.design.domain.validator.ValidationResult;
import com.cloudbuilder.design.domain.validator.ValidationRule;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class ValidationService {

    private final CanvasRepository canvasRepository;
    private final List<ValidationRule> validationRules;

    public ValidationService(CanvasRepository canvasRepository, List<ValidationRule> validationRules) {
        this.canvasRepository = canvasRepository;
        this.validationRules = validationRules;
    }

    public ValidationReport validateCanvas(UUID canvasId) {
        Canvas canvas = canvasRepository.findById(canvasId)
                .orElseThrow(() -> new RuntimeException("Canvas not found: " + canvasId));

        List<ValidationReport.ValidationIssue> issues = new ArrayList<>();

        for (ValidationRule rule : validationRules) {
            for (CanvasNode node : canvas.getCanvasNodes()) {
                ValidationResult result = rule.validate(canvas, node);
                if (!result.valid()) {
                    issues.add(new ValidationReport.ValidationIssue(
                            result.ruleName(),
                            result.severity().name(),
                            result.message(),
                            result.componentId()
                    ));
                }
            }

            for (CanvasEdge edge : canvas.getCanvasEdges()) {
                ValidationResult result = rule.validate(canvas, edge);
                if (!result.valid()) {
                    issues.add(new ValidationReport.ValidationIssue(
                            result.ruleName(),
                            result.severity().name(),
                            result.message(),
                            result.componentId()
                    ));
                }
            }
        }

        ValidationReport.CanvasValidationStatus status = determineStatus(issues);
        return new ValidationReport(canvasId, status, issues, Instant.now());
    }

    private ValidationReport.CanvasValidationStatus determineStatus(List<ValidationReport.ValidationIssue> issues) {
        if (issues.isEmpty()) {
            return ValidationReport.CanvasValidationStatus.VALID;
        }
        boolean hasErrors = issues.stream().anyMatch(
                i -> "ERROR".equals(i.severity()));
        if (hasErrors) {
            return ValidationReport.CanvasValidationStatus.INVALID;
        }
        boolean hasWarnings = issues.stream().anyMatch(
                i -> "WARNING".equals(i.severity()));
        if (hasWarnings) {
            return ValidationReport.CanvasValidationStatus.WARNINGS;
        }
        return ValidationReport.CanvasValidationStatus.VALID;
    }
}
