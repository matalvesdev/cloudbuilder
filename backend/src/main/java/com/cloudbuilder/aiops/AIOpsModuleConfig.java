package com.cloudbuilder.aiops;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EnableJpaRepositories(basePackages = "com.cloudbuilder.aiops.domain.port")
public class AIOpsModuleConfig {}
