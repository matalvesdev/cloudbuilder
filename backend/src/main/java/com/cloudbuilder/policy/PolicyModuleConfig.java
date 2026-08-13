package com.cloudbuilder.policy;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EnableJpaRepositories(basePackages = "com.cloudbuilder.policy.domain.port")
public class PolicyModuleConfig {
}
