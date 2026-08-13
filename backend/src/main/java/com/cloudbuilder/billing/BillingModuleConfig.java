package com.cloudbuilder.billing;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EnableJpaRepositories(basePackages = "com.cloudbuilder.billing.domain.port")
public class BillingModuleConfig {
}
