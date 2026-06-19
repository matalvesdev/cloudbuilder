package com.cloudbuilder.audit.infrastructure.aspect;

import com.cloudbuilder.audit.domain.Audited;
import com.cloudbuilder.audit.domain.service.AuditService;
import com.cloudbuilder.shared.security.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.AnnotationUtils;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;
import java.util.Optional;

@Aspect
@Component
public class AuditAspect {

    private static final Logger log = LoggerFactory.getLogger(AuditAspect.class);
    private static final ExpressionParser PARSER = new SpelExpressionParser();

    private final AuditService auditService;

    public AuditAspect(AuditService auditService) {
        this.auditService = auditService;
    }

    @Around("@annotation(audited)")
    public Object audit(ProceedingJoinPoint joinPoint, Audited audited) throws Throwable {
        long start = System.currentTimeMillis();
        Throwable failure = null;
        Object result;

        try {
            result = joinPoint.proceed();
        } catch (Throwable t) {
            failure = t;
            throw t;
        } finally {
            long duration = System.currentTimeMillis() - start;
            try {
                recordEvent(joinPoint, audited, failure, duration);
            } catch (Exception e) {
                log.warn("Failed to record audit event: {}", e.getMessage());
            }
        }

        return result;
    }

    private void recordEvent(ProceedingJoinPoint joinPoint, Audited audited,
                             Throwable failure, long durationMs) {
        var signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();

        // Resolve annotation (supporting @Audited on class level)
        Audited resolved = Optional.ofNullable(
                AnnotationUtils.findAnnotation(method, Audited.class)
        ).orElse(audited);

        // User
        String userId = Optional.ofNullable(SecurityContextHolder.getContext().getAuthentication())
                .filter(Authentication::isAuthenticated)
                .map(auth -> auth.getPrincipal())
                .filter(p -> !"anonymousUser".equals(p))
                .map(Object::toString)
                .orElse("system");

        // Tenant
        String tenantId = Optional.ofNullable(TenantContext.getTenantId())
                .filter(t -> !t.isBlank())
                .orElse("system");

        // IP
        String ipAddress = resolveIp();

        // Build context for SpEL evaluation
        var evalCtx = new StandardEvaluationContext();
        evalCtx.setVariable("failure", failure != null);
        evalCtx.setVariable("durationMs", durationMs);
        evalCtx.setVariable("result", failure == null ? "SUCCESS" : "FAILURE");

        String[] paramNames = signature.getParameterNames();
        Object[] paramValues = joinPoint.getArgs();
        if (paramNames != null) {
            for (int i = 0; i < paramNames.length && i < paramValues.length; i++) {
                evalCtx.setVariable(paramNames[i], paramValues[i]);
            }
        }

        String resourceId = evalSpel(resolved.resourceId(), evalCtx, "");
        String details = evalSpel(resolved.details(), evalCtx, "");

        // Append failure info to details when applicable
        if (failure != null) {
            details = details.isEmpty()
                    ? "FAILED: " + failure.getClass().getSimpleName()
                    : details + " | FAILED: " + failure.getClass().getSimpleName();
        }

        String action = resolved.action();
        String resourceType = resolved.resourceType();

        auditService.recordEvent(tenantId, userId, action, resourceType, resourceId, details, ipAddress);
    }

    private String resolveIp() {
        try {
            var attrs = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            HttpServletRequest request = attrs.getRequest();
            String xfwd = request.getHeader("X-Forwarded-For");
            if (xfwd != null && !xfwd.isBlank()) {
                return xfwd.split(",")[0].trim();
            }
            return request.getRemoteAddr();
        } catch (IllegalStateException e) {
            return "unknown";
        }
    }

    private String evalSpel(String expression, StandardEvaluationContext ctx, String fallback) {
        if (expression == null || expression.isBlank()) {
            return fallback;
        }
        try {
            return PARSER.parseExpression(expression).getValue(ctx, String.class);
        } catch (Exception e) {
            // Not SpEL — use as literal
            return expression;
        }
    }
}
