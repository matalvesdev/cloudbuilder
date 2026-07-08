package com.cloudbuilder.shared.event.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;

@Configuration
@EnableJpaRepositories(basePackages = {
    "com.cloudbuilder.shared.event.domain",
    "com.cloudbuilder.shared.event.port"
})
public class EventModuleConfig {}
