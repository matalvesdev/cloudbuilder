package com.cloudbuilder.docs;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@Profile("!render-lite")
@EnableJpaRepositories(basePackages = "com.cloudbuilder.docs.domain.port")
public class DocsModuleConfig {}
