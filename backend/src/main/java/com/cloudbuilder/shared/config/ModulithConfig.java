package com.cloudbuilder.shared.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.modulith.Modulith;

@Configuration
@Modulith
@Profile("!render-lite")
public class ModulithConfig {
}
