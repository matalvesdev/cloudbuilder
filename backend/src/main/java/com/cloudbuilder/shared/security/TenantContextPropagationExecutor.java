package com.cloudbuilder.shared.security;

import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.concurrent.Callable;
import java.util.concurrent.Future;

/**
 * Custom task executor that propagates tenant context (and security context)
 * from the submitting thread to the executing thread.
 * <p>
 * This ensures that {@link TenantContext#getTenantId()} works correctly
 * inside {@code @Async} methods, Kafka listeners, and other async operations.
 */
public class TenantContextPropagationExecutor extends ThreadPoolTaskExecutor {

    @Override
    public void execute(Runnable task) {
        var tenantId = TenantContext.getTenantId();
        var securityContext = SecurityContextHolder.getContext();
        super.execute(() -> {
            try {
                TenantContext.setTenantId(tenantId);
                SecurityContextHolder.setContext(securityContext);
                task.run();
            } finally {
                TenantContext.clear();
                SecurityContextHolder.clearContext();
            }
        });
    }

    @Override
    public Future<?> submit(Runnable task) {
        var tenantId = TenantContext.getTenantId();
        var securityContext = SecurityContextHolder.getContext();
        return super.submit(() -> {
            try {
                TenantContext.setTenantId(tenantId);
                SecurityContextHolder.setContext(securityContext);
                task.run();
            } finally {
                TenantContext.clear();
                SecurityContextHolder.clearContext();
            }
        });
    }

    @Override
    public <T> Future<T> submit(Callable<T> task) {
        var tenantId = TenantContext.getTenantId();
        var securityContext = SecurityContextHolder.getContext();
        return super.submit(() -> {
            try {
                TenantContext.setTenantId(tenantId);
                SecurityContextHolder.setContext(securityContext);
                return task.call();
            } finally {
                TenantContext.clear();
                SecurityContextHolder.clearContext();
            }
        });
    }
}
