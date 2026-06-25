package com.cloudbuilder.analytics;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
@EnableJpaRepositories(basePackages = "com.cloudbuilder.analytics.domain.port")
public class AnalyticsConfiguration {
}

