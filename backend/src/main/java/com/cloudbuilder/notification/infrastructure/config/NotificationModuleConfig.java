package com.cloudbuilder.notification.infrastructure.config;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableAsync;

@Configuration
@EnableAsync
@ComponentScan(basePackages = "com.cloudbuilder.notification")
@EnableJpaRepositories(basePackages = "com.cloudbuilder.notification.domain.port")
public class NotificationModuleConfig {
}
