package com.cloudbuilder.shared.event.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.ApplicationEventMulticaster;
import org.springframework.context.event.SimpleApplicationEventMulticaster;
import org.springframework.core.task.SimpleAsyncTaskExecutor;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Configures async event publishing so that @EventListener methods
 * run in separate threads and do not block the publisher.
 *
 * Also enables @Scheduled for:
 * - OutboxSweeper: retries PENDING entries every 30s, cleans up PROCESSED entries >24h
 * - Any future event-infrastructure scheduled tasks
 */
@Configuration
@EnableAsync
@EnableScheduling
public class EventConfig {

    @Bean
    public ApplicationEventMulticaster applicationEventMulticaster() {
        var multicaster = new SimpleApplicationEventMulticaster();
        multicaster.setTaskExecutor(new SimpleAsyncTaskExecutor("event-"));
        return multicaster;
    }
}
