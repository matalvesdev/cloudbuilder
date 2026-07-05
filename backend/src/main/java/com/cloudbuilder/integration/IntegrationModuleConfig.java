package com.cloudbuilder.integration;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EnableJpaRepositories(basePackages = "com.cloudbuilder.integration.domain.port")
public class IntegrationModuleConfig {}
