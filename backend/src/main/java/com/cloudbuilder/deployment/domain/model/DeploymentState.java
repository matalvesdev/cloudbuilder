package com.cloudbuilder.deployment.domain.model;

import com.cloudbuilder.deployment.domain.service.DeploymentStateMachine;

/**
 * Deployment lifecycle states with validated transitions.
 *
 * <p>State machine (ADR-038):
 * <pre>
 *   REQUESTED → VALIDATING → WAITING_APPROVAL → PROVISIONING → DEPLOYING → COMPLETED
 *                 ↓                ↓                  ↓              ↓
 *               FAILED           FAILED             FAILED         FAILED
 * </pre>
 *
 * <p>Every transition is validated by {@code DeploymentStateMachine}.
 * Invalid transitions throw {@code IllegalStateException}.
 */
public enum DeploymentState {
    /** Deployment requested by user or system */
    REQUESTED,
    /** Validating canvas design, credentials, and environment */
    VALIDATING,
    /** Waiting for manual approval (if required by policy) */
    WAITING_APPROVAL,
    /** Provisioning infrastructure via Go engine */
    PROVISIONING,
    /** Deploying application to provisioned infrastructure */
    DEPLOYING,
    /** Deployment completed successfully */
    COMPLETED,
    /** Deployment failed at any stage */
    FAILED;

    /**
     * Check if a transition from this state to the target state is valid.
     */
    public boolean canTransitionTo(DeploymentState target) {
        return DeploymentStateMachine.isValidTransition(this, target);
    }
}
