package com.cloudbuilder.deployment;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EnableJpaRepositories(basePackages = "com.cloudbuilder.deployment.domain.port")
public class DeploymentModuleConfig {}
