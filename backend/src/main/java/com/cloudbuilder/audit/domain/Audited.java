package com.cloudbuilder.audit.domain;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a controller or service method for automatic audit logging.
 * The aspect will capture the authenticated user, tenant, IP address,
 * and persist an AuditEvent with the specified metadata.
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface Audited {

    /** What happened — e.g. "CREATE", "UPDATE", "DELETE", "LOGIN" */
    String action();

    /** The kind of resource — e.g. "Canvas", "User", "Environment" */
    String resourceType();

    /**
     * The resource identifier. Supports SpEL expressions referencing
     * method parameters by name, e.g. {@code #id}, {@code #canvasId}.
     * Literal strings are used as-is when no SpEL prefix is present.
     */
    String resourceId() default "";

    /** Optional free-form detail string (SpEL supported). */
    String details() default "";
}
