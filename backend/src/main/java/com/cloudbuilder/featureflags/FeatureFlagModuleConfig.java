package com.cloudbuilder.featureflags;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EnableJpaRepositories(basePackages = "com.cloudbuilder.featureflags.domain.port")
public class FeatureFlagModuleConfig {}
