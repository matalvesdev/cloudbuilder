package com.cloudbuilder.search;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("!render-lite")
@ComponentScan(basePackages = "com.cloudbuilder.search")
public class SearchConfiguration {
}
