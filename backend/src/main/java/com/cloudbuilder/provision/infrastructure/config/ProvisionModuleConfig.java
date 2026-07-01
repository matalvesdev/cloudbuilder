package com.cloudbuilder.provision.infrastructure.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EnableJpaRepositories(basePackages = "com.cloudbuilder.provision.domain.port")
public class ProvisionModuleConfig {
}
