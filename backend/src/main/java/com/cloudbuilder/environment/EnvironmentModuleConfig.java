package com.cloudbuilder.environment;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EnableJpaRepositories(basePackages = "com.cloudbuilder.environment.domain.port")
public class EnvironmentModuleConfig {}
