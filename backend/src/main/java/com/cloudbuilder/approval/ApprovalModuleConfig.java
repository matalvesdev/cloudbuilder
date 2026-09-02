package com.cloudbuilder.approval;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@Profile("!render-lite")
@EnableJpaRepositories(basePackages = "com.cloudbuilder.approval.domain.port")
public class ApprovalModuleConfig {}
