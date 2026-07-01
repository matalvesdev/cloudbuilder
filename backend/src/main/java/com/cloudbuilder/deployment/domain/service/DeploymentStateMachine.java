package com.cloudbuilder.deployment.domain.service;

import com.cloudbuilder.deployment.domain.model.DeploymentState;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * State machine for deployment lifecycle transitions.
 *
 * <p>Enforces valid state transitions and provides transition metadata.
 * Every state change must go through this service to prevent invalid transitions.
 *
 * <p>State diagram:
 * <pre>
 *   REQUESTED → VALIDATING → WAITING_APPROVAL → PROVISIONING → DEPLOYING → COMPLETED
 *                 ↓                ↓                  ↓              ↓
 *               FAILED           FAILED             FAILED         FAILED
 * </pre>
 *
 * <p>Allowed transitions:
 * <ul>
 *   <li>REQUESTED → VALIDATING, FAILED</li>
 *   <li>VALIDATING → WAITING_APPROVAL, PROVISIONING, FAILED</li>
 *   <li>WAITING_APPROVAL → PROVISIONING, FAILED</li>
 *   <li>PROVISIONING → DEPLOYING, FAILED</li>
 *   <li>DEPLOYING → COMPLETED, FAILED</li>
 *   <li>COMPLETED → (terminal)</li>
 *   <li>FAILED → (terminal)</li>
 * </ul>
 */
@Service
public class DeploymentStateMachine {

    private static final Logger log = LoggerFactory.getLogger(DeploymentStateMachine.class);

    /**
     * Defines valid transitions: from → set of allowed targets.
     */
    private static final Map<DeploymentState, Set<DeploymentState>> TRANSITIONS = new EnumMap<>(DeploymentState.class);

    static {
        TRANSITIONS.put(DeploymentState.REQUESTED, EnumSet.of(
            DeploymentState.VALIDATING,
            DeploymentState.FAILED
        ));
        TRANSITIONS.put(DeploymentState.VALIDATING, EnumSet.of(
            DeploymentState.WAITING_APPROVAL,
            DeploymentState.PROVISIONING,
            DeploymentState.FAILED
        ));
        TRANSITIONS.put(DeploymentState.WAITING_APPROVAL, EnumSet.of(
            DeploymentState.PROVISIONING,
            DeploymentState.FAILED
        ));
        TRANSITIONS.put(DeploymentState.PROVISIONING, EnumSet.of(
            DeploymentState.DEPLOYING,
            DeploymentState.FAILED
        ));
        TRANSITIONS.put(DeploymentState.DEPLOYING, EnumSet.of(
            DeploymentState.COMPLETED,
            DeploymentState.FAILED
        ));
        // COMPLETED and FAILED are terminal states — no outgoing transitions
        TRANSITIONS.put(DeploymentState.COMPLETED, EnumSet.noneOf(DeploymentState.class));
        TRANSITIONS.put(DeploymentState.FAILED, EnumSet.noneOf(DeploymentState.class));
    }

    /**
     * Check if a transition from source to target is valid.
     */
    public static boolean isValidTransition(DeploymentState source, DeploymentState target) {
        Set<DeploymentState> allowed = TRANSITIONS.get(source);
        return allowed != null && allowed.contains(target);
    }

    /**
     * Get the set of valid target states from a given source state.
     */
    public static Set<DeploymentState> getAllowedTransitions(DeploymentState source) {
        return TRANSITIONS.getOrDefault(source, EnumSet.noneOf(DeploymentState.class));
    }

    /**
     * Validate and apply a state transition.
     *
     * @param current the current state
     * @param target  the desired target state
     * @return the target state if transition is valid
     * @throws IllegalStateException if transition is invalid
     */
    public DeploymentState transition(DeploymentState current, DeploymentState target) {
        if (!isValidTransition(current, target)) {
            String msg = String.format("Invalid deployment state transition: %s → %s (allowed: %s)",
                current, target, getAllowedTransitions(current));
            log.error(msg);
            throw new IllegalStateException(msg);
        }

        log.info("Deployment state transition: {} → {}", current, target);
        return target;
    }

    /**
     * Check if a deployment is in a terminal state (COMPLETED or FAILED).
     */
    public boolean isTerminal(DeploymentState state) {
        return state == DeploymentState.COMPLETED || state == DeploymentState.FAILED;
    }

    /**
     * Check if a deployment requires approval before proceeding.
     */
    public boolean requiresApproval(DeploymentState state) {
        return state == DeploymentState.WAITING_APPROVAL;
    }
}
