package com.cloudbuilder.observability;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
@EnableJpaRepositories(basePackages = "com.cloudbuilder.observability.domain.port")
public class ObservabilityModuleConfig {
}
