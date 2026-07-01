package com.cloudbuilder.git;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EnableJpaRepositories(basePackages = {"com.cloudbuilder.git.domain.port", "com.cloudbuilder.git.infrastructure.adapter"})
public class GitModuleConfig {}
