package com.cloudbuilder.design.domain.validator;

public record ValidationResult(
        String ruleName,
        boolean valid,
        Severity severity,
        String message,
        String componentId
) {
    public enum Severity {
        ERROR,
        WARNING,
        INFO
    }
}
