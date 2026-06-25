package com.cloudbuilder.analytics.infrastructure.aop;

import com.cloudbuilder.analytics.domain.model.AnalyticsEvent;
import com.cloudbuilder.analytics.domain.port.AnalyticsEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

/**
 * Separate {@link Service} bean for async analytics event persistence.
 *
 * Extracted from {@link TrackEventAspect} to avoid the Spring AOP
 * self-invocation problem — {@code @Async} only works when called
 * through a Spring proxy (external bean reference), not from within
 * the same class.
 *
 * Per ADR-024, analytics persistence is fire-and-forget: failures
 * are logged but never propagated to the caller.
 */
@Service
public class AnalyticsAsyncPersistenceService {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsAsyncPersistenceService.class);

    private final AnalyticsEventRepository analyticsEventRepository;

    public AnalyticsAsyncPersistenceService(AnalyticsEventRepository analyticsEventRepository) {
        this.analyticsEventRepository = analyticsEventRepository;
    }

    @Async
    public CompletableFuture<Void> persistEventAsync(AnalyticsEvent event) {
        try {
            analyticsEventRepository.save(event);
            log.debug("Tracked analytics event: module={}, action={}, userId={}",
                    event.getModule(), event.getAction(), event.getUserId());
        } catch (Exception e) {
            log.warn("Failed to persist analytics event: {}", e.getMessage());
        }
        return CompletableFuture.completedFuture(null);
    }
}
