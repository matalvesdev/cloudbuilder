package com.cloudbuilder.analytics;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EnableJpaRepositories(basePackages = "com.cloudbuilder.analytics.domain.port")
public class AnalyticsModuleConfig {}
