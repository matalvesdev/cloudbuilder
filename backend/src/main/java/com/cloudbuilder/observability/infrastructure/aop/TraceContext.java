package com.cloudbuilder.observability.infrastructure.aop;

/**
 * @deprecated Use {@link com.cloudbuilder.shared.monitoring.TraceContext} instead.
 * Kept for backwards compatibility only.
 */
@Deprecated
public final class TraceContext {

    private TraceContext() {}

    public static String getTraceId() {
        return com.cloudbuilder.shared.monitoring.TraceContext.getTraceId();
    }

    public static String getSpanId() {
        return com.cloudbuilder.shared.monitoring.TraceContext.getSpanId();
    }

    public static String getParentSpanId() {
        return com.cloudbuilder.shared.monitoring.TraceContext.getParentSpanId();
    }

    public static String getOrCreateTraceId() {
        return com.cloudbuilder.shared.monitoring.TraceContext.getOrCreateTraceId();
    }

    public static void set(String traceId, String spanId, String parentSpanId) {
        com.cloudbuilder.shared.monitoring.TraceContext.set(traceId, spanId, parentSpanId);
    }

    public static void clear() {
        com.cloudbuilder.shared.monitoring.TraceContext.clear();
    }
}
