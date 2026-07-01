package com.cloudbuilder.tenant;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EnableJpaRepositories(basePackages = "com.cloudbuilder.tenant.domain.port")
public class TenantModuleConfig {
}
