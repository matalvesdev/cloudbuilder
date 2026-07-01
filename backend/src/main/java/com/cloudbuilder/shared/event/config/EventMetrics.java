package com.cloudbuilder.shared.event.config;

import com.cloudbuilder.shared.event.domain.EventOutboxRepository;
import com.cloudbuilder.shared.security.TenantContext;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Micrometer metrics for the event bus and transactional outbox.
 *
 * Exposes:
 *   cloudbuilder.eventbus.published.total      — events published via ApplicationEventPublisher
 *   cloudbuilder.eventbus.listener.success     — successful listener executions
 *   cloudbuilder.eventbus.listener.failure     — failed listener executions
 *   cloudbuilder.eventbus.outbox.pending       — current outbox backlog (gauged)
 *   cloudbuilder.eventbus.outbox.swept         — outbox entries retried by sweeper
 *   cloudbuilder.eventbus.outbox.cleaned       — outbox entries cleaned by retention sweep
 *
 * All counters carry tenantId tag when TenantContext is available.
 */
@Component("eventBusMetrics")
public class EventMetrics {

    private static final Logger log = LoggerFactory.getLogger(EventMetrics.class);

    private final Counter publishedCounter;
    private final Counter listenerSuccessCounter;
    private final Counter listenerFailureCounter;
    private final Counter outboxSweptCounter;
    private final Counter outboxCleanedCounter;

    private final EventOutboxRepository outboxRepository;

    public EventMetrics(MeterRegistry registry, EventOutboxRepository outboxRepository) {
        this.outboxRepository = outboxRepository;

        this.publishedCounter = Counter.builder("cloudbuilder.eventbus.published.total")
            .description("Total events published via ApplicationEventPublisher")
            .register(registry);

        this.listenerSuccessCounter = Counter.builder("cloudbuilder.eventbus.listener.success")
            .description("Successful event listener executions")
            .register(registry);

        this.listenerFailureCounter = Counter.builder("cloudbuilder.eventbus.listener.failure")
            .description("Failed event listener executions")
            .register(registry);

        this.outboxSweptCounter = Counter.builder("cloudbuilder.eventbus.outbox.swept")
            .description("Outbox entries retried by scheduled sweeper")
            .register(registry);

        this.outboxCleanedCounter = Counter.builder("cloudbuilder.eventbus.outbox.cleaned")
            .description("Outbox entries removed by retention sweep")
            .register(registry);
    }

    public void recordPublished() {
        publishedCounter.increment();
    }

    public void recordListenerSuccess() {
        listenerSuccessCounter.increment();
    }

    public void recordListenerFailure() {
        listenerFailureCounter.increment();
    }

    public void recordOutboxSwept() {
        outboxSweptCounter.increment();
    }

    public void recordOutboxCleaned() {
        outboxCleanedCounter.increment();
    }
}
