package com.cloudbuilder.iam;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EnableJpaRepositories(basePackages = "com.cloudbuilder.iam.domain.port")
public class IAMModuleConfig {}
