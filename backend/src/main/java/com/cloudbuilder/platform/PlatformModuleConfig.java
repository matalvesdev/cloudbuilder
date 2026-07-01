package com.cloudbuilder.platform;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EnableJpaRepositories(basePackages = "com.cloudbuilder.platform.domain.port")
public class PlatformModuleConfig {}
