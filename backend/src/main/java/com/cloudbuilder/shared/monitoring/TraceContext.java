package com.cloudbuilder.shared.monitoring;

import java.util.UUID;

public final class TraceContext {

    private static final ThreadLocal<TraceContextHolder> holder = new ThreadLocal<>();

    private TraceContext() {}

    public static String getTraceId() {
        var ctx = holder.get();
        return ctx != null ? ctx.traceId() : null;
    }

    public static String getSpanId() {
        var ctx = holder.get();
        return ctx != null ? ctx.spanId() : null;
    }

    public static String getParentSpanId() {
        var ctx = holder.get();
        return ctx != null ? ctx.parentSpanId() : null;
    }

    public static String getOrCreateTraceId() {
        var ctx = holder.get();
        if (ctx != null && ctx.traceId() != null) {
            return ctx.traceId();
        }
        String newTraceId = UUID.randomUUID().toString().replace("-", "");
        String newSpanId = UUID.randomUUID().toString().replace("-", "");
        set(newTraceId, newSpanId, null);
        return newTraceId;
    }

    public static void set(String traceId, String spanId, String parentSpanId) {
        holder.set(new TraceContextHolder(traceId, spanId, parentSpanId));
    }

    public static void clear() {
        holder.remove();
    }

    private record TraceContextHolder(String traceId, String spanId, String parentSpanId) {}
}
