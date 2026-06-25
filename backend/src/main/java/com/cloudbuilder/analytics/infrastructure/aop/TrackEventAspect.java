package com.cloudbuilder.analytics.infrastructure.aop;

import com.cloudbuilder.analytics.domain.model.AnalyticsEvent;
import com.cloudbuilder.shared.security.TenantContext;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.DefaultParameterNameDiscoverer;
import org.springframework.core.ParameterNameDiscoverer;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;

/**
 * Aspect that intercepts methods annotated with {@link TrackEvent} and
 * persists an {@link AnalyticsEvent} asynchronously.
 * <p>
 * The aspect extracts:
 * <ul>
 *   <li>{@code module} and {@code action} from the annotation</li>
 *   <li>{@code userId} from {@link SecurityContextHolder}</li>
 *   <li>{@code tenantId} from {@link TenantContext}</li>
 *   <li>{@code resourceId} and {@code resourceType} via SpEL expressions
 *       evaluated against the method arguments</li>
 * </ul>
 * <p>
 * The event is saved asynchronously via {@code @Async} to avoid impacting
 * the response time of the intercepted method. If saving fails, the error
 * is logged but never propagated to the caller (fire-and-forget).
 */
@Aspect
@Component
public class TrackEventAspect {

    private static final Logger log = LoggerFactory.getLogger(TrackEventAspect.class);

    private final AnalyticsAsyncPersistenceService asyncPersistenceService;
    private final ExpressionParser expressionParser;
    private final ParameterNameDiscoverer parameterNameDiscoverer;

    public TrackEventAspect(AnalyticsAsyncPersistenceService asyncPersistenceService) {
        this.asyncPersistenceService = asyncPersistenceService;
        this.expressionParser = new SpelExpressionParser();
        this.parameterNameDiscoverer = new DefaultParameterNameDiscoverer();
    }

    @Around("@annotation(trackEvent)")
    public Object trackEvent(ProceedingJoinPoint joinPoint, TrackEvent trackEvent) throws Throwable {
        // Execute the original method first
        var result = joinPoint.proceed();

        // Capture and persist the event asynchronously (fire-and-forget)
        // Delegates to AnalyticsAsyncPersistenceService to avoid Spring AOP
        // self-invocation problem with @Async
        try {
            var event = buildEvent(joinPoint, trackEvent);
            asyncPersistenceService.persistEventAsync(event);
        } catch (Exception e) {
            // Log but never throw — analytics must not break business logic
            log.warn("Failed to track analytics event for module={}, action={}: {}",
                    trackEvent.module(), trackEvent.action(), e.getMessage());
        }

        return result;
    }

    // ---------------------------------------------------------------
    // Event building
    // ---------------------------------------------------------------

    private AnalyticsEvent buildEvent(ProceedingJoinPoint joinPoint, TrackEvent trackEvent) {
        var module = trackEvent.module();
        var action = trackEvent.action();
        var userId = resolveUserId();
        var tenantId = resolveTenantId();

        var event = new AnalyticsEvent("TRACK", userId, tenantId, module, action);

        // Resolve SpEL expressions for resourceId and resourceType
        var resourceId = resolveSpel(joinPoint, trackEvent.resourceId());
        var resourceType = resolveSpel(joinPoint, trackEvent.resourceType());

        if (resourceId != null && !resourceId.isEmpty()) {
            event.setResourceId(resourceId);
        }
        if (resourceType != null && !resourceType.isEmpty()) {
            event.setResourceType(resourceType);
        }

        return event;
    }

    // ---------------------------------------------------------------
    // Context resolution
    // ---------------------------------------------------------------

    private static String resolveUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            var principal = authentication.getPrincipal();
            if (principal instanceof String userId) {
                return userId;
            }
            if (principal instanceof Authentication auth) {
                return auth.getName();
            }
        }
        return "anonymous";
    }

    private static String resolveTenantId() {
        var tenantId = TenantContext.getTenantId();
        return tenantId != null ? tenantId : "default";
    }

    // ---------------------------------------------------------------
    // SpEL evaluation
    // ---------------------------------------------------------------

    private String resolveSpel(ProceedingJoinPoint joinPoint, String expression) {
        if (expression == null || expression.isEmpty()) {
            return null;
        }

        try {
            var method = getMethod(joinPoint);
            if (method == null) {
                return null;
            }

            var paramNames = parameterNameDiscoverer.getParameterNames(method);
            if (paramNames == null) {
                return expressionParser.parseExpression(expression).getValue(String.class);
            }

            var context = new StandardEvaluationContext();
            var args = joinPoint.getArgs();
            for (int i = 0; i < paramNames.length && i < args.length; i++) {
                context.setVariable(paramNames[i], args[i]);
            }

            return expressionParser.parseExpression(expression).getValue(context, String.class);
        } catch (Exception e) {
            log.debug("Failed to evaluate SpEL expression '{}': {}", expression, e.getMessage());
            return null;
        }
    }

    private static Method getMethod(ProceedingJoinPoint joinPoint) {
        var signature = joinPoint.getSignature();
        if (signature instanceof MethodSignature methodSignature) {
            return methodSignature.getMethod();
        }
        return null;
    }

}
