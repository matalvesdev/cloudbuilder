package com.cloudbuilder.credential;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EnableJpaRepositories(basePackages = "com.cloudbuilder.credential.domain.port")
public class CredentialModuleConfig {}
