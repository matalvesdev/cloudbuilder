package com.cloudbuilder.git;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@Profile("!render-lite")
@EnableJpaRepositories(basePackages = {"com.cloudbuilder.git.domain.port", "com.cloudbuilder.git.infrastructure.adapter"})
public class GitModuleConfig {}
