package com.cloudbuilder.shared.event.resilience;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.function.Supplier;

/**
 * Retry manager with exponential backoff and jitter.
 * Replaces basic FixedBackOff with configurable retry strategies.
 */
public class RetryManager {

    private static final Logger log = LoggerFactory.getLogger(RetryManager.class);

    private final int maxAttempts;
    private final long initialBackoffMs;
    private final long maxBackoffMs;
    private final double jitterFactor;

    public RetryManager(int maxAttempts, long initialBackoffMs, long maxBackoffMs, double jitterFactor) {
        this.maxAttempts = maxAttempts;
        this.initialBackoffMs = initialBackoffMs;
        this.maxBackoffMs = maxBackoffMs;
        this.jitterFactor = jitterFactor;
    }

    /**
     * Execute with retry and exponential backoff.
     */
    public <T> T execute(Supplier<T> operation, String operationName) {
        Exception lastException = null;

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return operation.get();
            } catch (Exception e) {
                lastException = e;
                if (attempt < maxAttempts) {
                    long backoff = calculateBackoff(attempt);
                    log.warn("[RetryManager] {} failed (attempt {}/{}), retrying in {}ms: {}",
                            operationName, attempt, maxAttempts, backoff, e.getMessage());
                    sleep(backoff);
                }
            }
        }

        log.error("[RetryManager] {} failed after {} attempts", operationName, maxAttempts);
        throw new RetryExhaustedException(operationName, maxAttempts, lastException);
    }

    /**
     * Execute with retry, returning empty on exhausted.
     */
    public <T> T executeOrNull(Supplier<T> operation, String operationName) {
        try {
            return execute(operation, operationName);
        } catch (RetryExhaustedException e) {
            return null;
        }
    }

    /**
     * Calculate backoff with exponential growth + jitter.
     */
    long calculateBackoff(int attempt) {
        long exponential = initialBackoffMs * (1L << (attempt - 1));
        long capped = Math.min(exponential, maxBackoffMs);
        long jitter = (long) (capped * jitterFactor * Math.random());
        return capped + jitter;
    }

    private void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RetryInterruptedException(e);
        }
    }

    // ── Builder ──────────────────────────────────────────────────────

    public static RetryManager.Builder builder() {
        return new RetryManager.Builder();
    }

    public static class Builder {
        private int maxAttempts = 3;
        private long initialBackoffMs = 1000;
        private long maxBackoffMs = 30000;
        private double jitterFactor = 0.1;

        public Builder maxAttempts(int maxAttempts) { this.maxAttempts = maxAttempts; return this; }
        public Builder initialBackoffMs(long initialBackoffMs) { this.initialBackoffMs = initialBackoffMs; return this; }
        public Builder maxBackoffMs(long maxBackoffMs) { this.maxBackoffMs = maxBackoffMs; return this; }
        public Builder jitterFactor(double jitterFactor) { this.jitterFactor = jitterFactor; return this; }
        public RetryManager build() { return new RetryManager(maxAttempts, initialBackoffMs, maxBackoffMs, jitterFactor); }
    }

    // ── Exceptions ───────────────────────────────────────────────────

    public static class RetryExhaustedException extends RuntimeException {
        public RetryExhaustedException(String operation, int attempts, Exception cause) {
            super("Operation '" + operation + "' failed after " + attempts + " attempts", cause);
        }
    }

    public static class RetryInterruptedException extends RuntimeException {
        public RetryInterruptedException(InterruptedException cause) {
            super("Retry interrupted", cause);
        }
    }
}
