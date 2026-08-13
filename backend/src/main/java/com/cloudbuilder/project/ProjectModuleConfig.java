package com.cloudbuilder.project;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EnableJpaRepositories(basePackages = "com.cloudbuilder.project.domain.port")
public class ProjectModuleConfig {
}
