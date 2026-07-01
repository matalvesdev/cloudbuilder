package com.cloudbuilder.observe;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EnableJpaRepositories(basePackages = "com.cloudbuilder.observe.domain.port")
public class ObserveModuleConfig {}
