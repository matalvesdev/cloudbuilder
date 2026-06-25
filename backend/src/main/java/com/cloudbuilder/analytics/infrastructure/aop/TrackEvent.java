package com.cloudbuilder.analytics.infrastructure.aop;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation for tracking analytics events on service methods.
 * <p>
 * When a method annotated with {@code @TrackEvent} is executed, the
 * {@link TrackEventAspect} intercepts the call and persists an
 * {@link com.cloudbuilder.analytics.domain.model.AnalyticsEvent} with the
 * specified module, action, and optional resource details extracted from the
 * method arguments.
 * <p>
 * The {@code userId} and {@code tenantId} are automatically resolved from
 * {@link org.springframework.security.core.context.SecurityContext} and
 * {@link com.cloudbuilder.shared.security.TenantContext}.
 * <p>
 * Usage:
 * <pre>{@code
 * @TrackEvent(module = "provision", action = "code-generate")
 * public GeneratedCode generateCode(CanvasDesign design) { ... }
 * }</pre>
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface TrackEvent {

    /**
     * The module name that this event belongs to (e.g., "design", "provision",
     * "cost", "observe", "platform", "aiops", "iam").
     */
    String module();

    /**
     * The action being performed (e.g., "create", "update", "delete",
     * "code-generate", "deploy", "validate", "optimize").
     */
    String action();

    /**
     * Optional SpEL expression to extract a resource ID from the method arguments.
     * <p>
     * Example: {@code "#canvasId"} or {@code "#design.id"}
     */
    String resourceId() default "";

    /**
     * Optional SpEL expression to extract a resource type from the method
     * arguments.
     * <p>
     * Example: {@code "#canvas.type"} or {@code "'Canvas'"}
     */
    String resourceType() default "";
}
