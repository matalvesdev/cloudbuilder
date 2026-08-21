package com.cloudbuilder.shared.config;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/** Maps a platform-style PostgreSQL URL to Spring's JDBC datasource settings. */
public final class DatabaseUrlConfigurer {
    private DatabaseUrlConfigurer() {}

    public static void configureFrom(Map<String, String> environment) {
        String databaseUrl = environment.get("DATABASE_URL");
        if (databaseUrl == null || databaseUrl.isBlank()) {
            return;
        }

        URI uri = URI.create(databaseUrl);
        if (!"postgres".equals(uri.getScheme()) && !"postgresql".equals(uri.getScheme())) {
            return;
        }

        String host = uri.getHost();
        if (host == null || host.isBlank()) {
            throw new IllegalArgumentException("DATABASE_URL must include a PostgreSQL host");
        }
        String database = uri.getPath();
        if (database == null || database.length() <= 1) {
            throw new IllegalArgumentException("DATABASE_URL must include a database name");
        }

        StringBuilder jdbcUrl = new StringBuilder("jdbc:postgresql://").append(host);
        if (uri.getPort() != -1) {
            jdbcUrl.append(':').append(uri.getPort());
        }
        jdbcUrl.append(database);
        if (uri.getRawQuery() != null && !uri.getRawQuery().isBlank()) {
            jdbcUrl.append('?').append(uri.getRawQuery());
        } else {
            jdbcUrl.append("?sslmode=require");
        }

        System.setProperty("spring.datasource.url", jdbcUrl.toString());
        String userInfo = uri.getRawUserInfo();
        if (userInfo != null) {
            String[] credentials = userInfo.split(":", 2);
            System.setProperty("spring.datasource.username", decode(credentials[0]));
            if (credentials.length == 2) {
                System.setProperty("spring.datasource.password", decode(credentials[1]));
            }
        }
    }

    private static String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }
}
