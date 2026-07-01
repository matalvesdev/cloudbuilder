package com.cloudbuilder.multiregion;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EnableJpaRepositories(basePackages = "com.cloudbuilder.multiregion.domain.port")
public class MultiRegionModuleConfig {}
