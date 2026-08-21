package com.cloudbuilder.shared.config;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

class DatabaseUrlConfigurerTest {
    @AfterEach
    void clearProperties() {
        System.clearProperty("spring.datasource.url");
        System.clearProperty("spring.datasource.username");
        System.clearProperty("spring.datasource.password");
    }

    @Test
    void mapsPlatformPostgresUrlToJdbcProperties() {
        DatabaseUrlConfigurer.configureFrom(Map.of(
                "DATABASE_URL", "postgresql://app%40user:secret%2Fvalue@db.example.com:5432/cloudbuilder?sslmode=require"));

        assertEquals("jdbc:postgresql://db.example.com:5432/cloudbuilder?sslmode=require",
                System.getProperty("spring.datasource.url"));
        assertEquals("app@user", System.getProperty("spring.datasource.username"));
        assertEquals("secret/value", System.getProperty("spring.datasource.password"));
    }
}
