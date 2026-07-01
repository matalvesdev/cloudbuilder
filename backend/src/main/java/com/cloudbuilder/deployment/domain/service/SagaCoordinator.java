package com.cloudbuilder.deployment.domain.service;

import com.cloudbuilder.deployment.domain.model.SagaStep;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Orchestrates multi-step sagas with compensation logic.
 *
 * <p>The saga pattern ensures that if any step fails, all completed steps
 * are compensated (rolled back) in reverse order. This provides eventual
 * consistency across distributed operations.
 *
 * <p>Usage:
 * <pre>
 *   var saga = new SagaCoordinator&lt;DeployContext&gt;();
 *   saga.addStep("validate", ctx -> validate(ctx), ctx -> undoValidate(ctx));
 *   saga.addStep("provision", ctx -> provision(ctx), ctx -> deprovision(ctx));
 *   saga.addStep("deploy", ctx -> deploy(ctx), ctx -> rollbackDeploy(ctx));
 *
 *   DeployContext ctx = new DeployContext(...);
 *   SagaResult result = saga.execute(ctx);
 *   if (!result.isSuccess()) {
 *       log.error("Saga failed, compensations applied: {}", result.getCompensationsApplied());
 *   }
 * </pre>
 */
@Service
public class SagaCoordinator {

    private static final Logger log = LoggerFactory.getLogger(SagaCoordinator.class);

    /**
     * Result of a saga execution.
     */
    public record SagaResult<T>(
        boolean success,
        List<SagaStep<T>> steps,
        List<String> compensationsApplied,
        String errorMessage
    ) {
        public static <T> SagaResult<T> success(List<SagaStep<T>> steps) {
            return new SagaResult<>(true, steps, List.of(), null);
        }

        public static <T> SagaResult<T> failure(List<SagaStep<T>> steps, List<String> compensations, String error) {
            return new SagaResult<>(false, steps, compensations, error);
        }
    }

    /**
     * Execute a saga with the given steps and context.
     *
     * <p>Steps are executed sequentially. If any step fails:
     * <ol>
     *   <li>The failed step is marked as FAILED</li>
     *   <li>All completed steps are compensated in reverse order</li>
     *   <li>A failure result is returned with compensation details</li>
     * </ol>
     *
     * @param context the shared context passed to all steps
     * @param steps   the saga steps to execute
     * @return the saga result with success/failure and compensation details
     */
    public <T> SagaResult<T> execute(T context, List<SagaStep<T>> steps) {
        String sagaId = UUID.randomUUID().toString().substring(0, 8);
        List<SagaStep<T>> executedSteps = new ArrayList<>();
        List<String> compensationsApplied = new ArrayList<>();

        log.info("[Saga-{}] Starting saga with {} steps", sagaId, steps.size());

        for (int i = 0; i < steps.size(); i++) {
            SagaStep<T> step = steps.get(i);
            log.info("[Saga-{}] Executing step {}/{}: {}", sagaId, i + 1, steps.size(), step.name());

            try {
                // Mark as running
                SagaStep<T> runningStep = step.withStatus(SagaStep.StepStatus.RUNNING);
                executedSteps.add(runningStep);

                // Execute the action
                step.action().execute(context);

                // Mark as completed
                SagaStep<T> completedStep = runningStep.withStatus(SagaStep.StepStatus.COMPLETED);
                executedSteps.set(executedSteps.size() - 1, completedStep);

                log.info("[Saga-{}] Step '{}' completed successfully", sagaId, step.name());

            } catch (Exception e) {
                String error = String.format("Step '%s' failed: %s", step.name(), e.getMessage());
                log.error("[Saga-{}] {}", sagaId, error);

                // Mark as failed
                SagaStep<T> failedStep = executedSteps.get(executedSteps.size() - 1).withError(error);
                executedSteps.set(executedSteps.size() - 1, failedStep);

                // Compensate in reverse order
                log.info("[Saga-{}] Starting compensation for {} completed steps", sagaId, executedSteps.size() - 1);
                compensationsApplied.addAll(compensate(sagaId, executedSteps, context));

                return SagaResult.failure(executedSteps, compensationsApplied, error);
            }
        }

        log.info("[Saga-{}] Saga completed successfully", sagaId);
        return SagaResult.success(executedSteps);
    }

    /**
     * Compensate all completed steps in reverse order.
     */
    private <T> List<String> compensate(String sagaId, List<SagaStep<T>> executedSteps, T context) {
        List<String> compensationsApplied = new ArrayList<>();

        for (int i = executedSteps.size() - 1; i >= 0; i--) {
            SagaStep<T> step = executedSteps.get(i);
            if (step.status() != SagaStep.StepStatus.COMPLETED) continue;

            try {
                log.info("[Saga-{}] Compensating step '{}'", sagaId, step.name());
                step.compensation().execute(context);
                compensationsApplied.add(step.name());

                // Mark as compensated
                executedSteps.set(i, step.withStatus(SagaStep.StepStatus.COMPENSATED));

                log.info("[Saga-{}] Step '{}' compensated successfully", sagaId, step.name());

            } catch (Exception e) {
                log.error("[Saga-{}] CRITICAL: Failed to compensate step '{}': {}",
                    sagaId, step.name(), e.getMessage());
                // Log but continue — try to compensate remaining steps
                compensationsApplied.add(step.name() + " (FAILED: " + e.getMessage() + ")");
            }
        }

        return compensationsApplied;
    }
}
