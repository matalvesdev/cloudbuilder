package com.cloudbuilder.deployment.domain.model;

import java.time.Instant;

/**
 * Represents a single step in a saga (multi-step transaction).
 *
 * <p>Each step has an action (forward) and a compensation (rollback).
 * If any step fails, all completed steps are compensated in reverse order.
 *
 * @param <T> the context type passed through the saga
 */
public record SagaStep<T>(
    String name,
    SagaAction<T> action,
    SagaAction<T> compensation,
    Instant startedAt,
    Instant completedAt,
    StepStatus status,
    String errorMessage
) {
    public enum StepStatus {
        PENDING, RUNNING, COMPLETED, FAILED, COMPENSATED
    }

    public SagaStep(String name, SagaAction<T> action, SagaAction<T> compensation) {
        this(name, action, compensation, null, null, StepStatus.PENDING, null);
    }

    /**
     * Functional interface for saga step actions.
     */
    @FunctionalInterface
    public interface SagaAction<T> {
        void execute(T context) throws Exception;
    }

    /**
     * Create a copy with updated status.
     */
    public SagaStep<T> withStatus(StepStatus newStatus) {
        return new SagaStep<>(name, action, compensation,
            startedAt == null && newStatus == StepStatus.RUNNING ? Instant.now() : startedAt,
            newStatus == StepStatus.COMPLETED ? Instant.now() : completedAt,
            newStatus, errorMessage);
    }

    /**
     * Create a copy with error message.
     */
    public SagaStep<T> withError(String error) {
        return new SagaStep<>(name, action, compensation, startedAt, completedAt, StepStatus.FAILED, error);
    }
}
