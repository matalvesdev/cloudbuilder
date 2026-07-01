package com.cloudbuilder.shared.event.resilience;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.concurrent.*;

/**
 * Per-step timeout manager for long-running operations.
 * Wraps operations with configurable timeouts using CompletableFuture.
 */
public class TimeoutManager {

    private static final Logger log = LoggerFactory.getLogger(TimeoutManager.class);

    private final Map<String, Duration> stepTimeouts;
    private final Duration defaultTimeout;
    private final ScheduledExecutorService scheduler;

    public TimeoutManager(Map<String, Duration> stepTimeouts, Duration defaultTimeout) {
        this.stepTimeouts = stepTimeouts;
        this.defaultTimeout = defaultTimeout;
        this.scheduler = Executors.newScheduledThreadPool(2, r -> {
            Thread t = new Thread(r, "timeout-manager");
            t.setDaemon(true);
            return t;
        });
    }

    /**
     * Execute operation with timeout for named step.
     */
    public <T> T executeWithTimeout(String stepName, Callable<T> operation) throws TimeoutException {
        Duration timeout = stepTimeouts.getOrDefault(stepName, defaultTimeout);
        long timeoutMs = timeout.toMillis();

        log.debug("[TimeoutManager] Executing '{}' with timeout {}ms", stepName, timeoutMs);

        Future<T> future = scheduler.submit(operation);
        try {
            return future.get(timeoutMs, TimeUnit.MILLISECONDS);
        } catch (TimeoutException e) {
            future.cancel(true);
            log.error("[TimeoutManager] '{}' timed out after {}ms", stepName, timeoutMs);
            throw new StepTimeoutException(stepName, timeoutMs, e);
        } catch (ExecutionException e) {
            Throwable cause = e.getCause();
            if (cause instanceof RuntimeException) {
                throw (RuntimeException) cause;
            }
            throw new ExecutionException("Step '" + stepName + "' failed", cause);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RetryManager.RetryInterruptedException(e);
        }
    }

    /**
     * Execute Runnable with timeout.
     */
    public void executeWithTimeout(String stepName, Runnable operation) throws TimeoutException {
        executeWithTimeout(stepName, () -> {
            operation.run();
            return null;
        });
    }

    /**
     * Get timeout for a step (for display/testing).
     */
    public Duration getTimeout(String stepName) {
        return stepTimeouts.getOrDefault(stepName, defaultTimeout);
    }

    public void shutdown() {
        scheduler.shutdownNow();
    }

    // ── Builder ──────────────────────────────────────────────────────

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final java.util.Map<String, Duration> stepTimeouts = new ConcurrentHashMap<>();
        private Duration defaultTimeout = Duration.ofSeconds(30);

        public Builder defaultTimeout(Duration timeout) { this.defaultTimeout = timeout; return this; }
        public Builder stepTimeout(String step, Duration timeout) { this.stepTimeouts.put(step, timeout); return this; }
        public Builder stepTimeout(String step, long seconds) { this.stepTimeouts.put(step, Duration.ofSeconds(seconds)); return this; }
        public TimeoutManager build() { return new TimeoutManager(stepTimeouts, defaultTimeout); }
    }

    // ── Exceptions ───────────────────────────────────────────────────

    public static class StepTimeoutException extends TimeoutException {
        private final String stepName;
        private final long timeoutMs;

        public StepTimeoutException(String stepName, long timeoutMs, TimeoutException cause) {
            super("Step '" + stepName + "' timed out after " + timeoutMs + "ms");
            this.stepName = stepName;
            this.timeoutMs = timeoutMs;
            initCause(cause);
        }

        public String getStepName() { return stepName; }
        public long getTimeoutMs() { return timeoutMs; }
    }
}
