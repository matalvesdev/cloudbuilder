package com.cloudbuilder.marketplace;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EnableJpaRepositories(basePackages = "com.cloudbuilder.marketplace.domain.port")
public class MarketplaceModuleConfig {
}
