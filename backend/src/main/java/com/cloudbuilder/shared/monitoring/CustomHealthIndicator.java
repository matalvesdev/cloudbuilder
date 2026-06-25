package com.cloudbuilder.shared.monitoring;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.actuate.health.Status;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.io.File;
import java.net.InetSocketAddress;
import java.net.Socket;

/**
 * Custom health indicator combining multiple subsystem checks:
 * <ul>
 *   <li><b>Database</b> — validates connectivity via simple query</li>
 *   <li><b>Disk space</b> — ensures sufficient free disk space for logs</li>
 *   <li><b>Provision Engine</b> — checks gRPC connectivity (if configured)</li>
 * </ul>
 * <p>
 * Exposed at {@code /actuator/health} alongside built-in Spring Boot health indicators.
 * Used by Kubernetes liveness/readiness probes and Prometheus alerting.
 */
@Component
public class CustomHealthIndicator implements HealthIndicator {

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    /** Minimum free disk space in bytes (500 MB). */
    private static final long MIN_DISK_SPACE_BYTES = 500L * 1024 * 1024;

    /** Provision Engine gRPC host (from env or default). */
    private static final String ENGINE_HOST = System.getenv("ENGINE_HOST");

    /** Provision Engine gRPC port (from env or default 50051). */
    private static final int ENGINE_PORT = parseIntOrDefault(System.getenv("ENGINE_PORT"), 50051);

    public CustomHealthIndicator(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        this.dataSource = dataSource;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Health health() {
        Health.Builder builder = new Health.Builder();

        try {
            // 1. Database connectivity check
            checkDatabase(builder);
        } catch (Exception e) {
            builder.withDetail("database", Health.down()
                .withDetail("error", e.getMessage())
                .build());
        }

        try {
            // 2. Disk space check
            checkDiskSpace(builder);
        } catch (Exception e) {
            builder.withDetail("diskSpace", Health.down()
                .withDetail("error", e.getMessage())
                .build());
        }

        try {
            // 3. Provision Engine connectivity (optional — only if ENGINE_HOST is set)
            if (ENGINE_HOST != null && !ENGINE_HOST.isBlank()) {
                checkEngineConnectivity(builder);
            } else {
                builder.withDetail("provisionEngine", Health.unknown()
                    .withDetail("message", "ENGINE_HOST not configured — skipping check")
                    .build());
            }
        } catch (Exception e) {
            builder.withDetail("provisionEngine", Health.down()
                .withDetail("error", e.getMessage())
                .build());
        }

        // Determine overall status — if any component is DOWN, overall is DOWN
        return builder.build();
    }

    private void checkDatabase(Health.Builder builder) {
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            builder.withDetail("database", Health.up()
                .withDetail("database", "PostgreSQL")
                .withDetail("validationQuery", "SELECT 1")
                .build());
        } catch (DataAccessException e) {
            builder.down();
            builder.withDetail("database", Health.down()
                .withDetail("error", e.getMessage())
                .build());
        }
    }

    private void checkDiskSpace(Health.Builder builder) {
        File logDir = new File("logs");
        if (!logDir.exists()) {
            logDir.mkdirs();
        }
        File root = new File(".");
        long freeBytes = root.getFreeSpace();
        long totalBytes = root.getTotalSpace();
        long usedBytes = totalBytes - root.getUsableSpace();

        builder.withDetail("diskSpace", Health.up()
            .withDetail("free", formatBytes(freeBytes))
            .withDetail("total", formatBytes(totalBytes))
            .withDetail("used", formatBytes(usedBytes))
            .withDetail("threshold", formatBytes(MIN_DISK_SPACE_BYTES))
            .withDetail("path", root.getAbsolutePath())
            .build());

        if (freeBytes < MIN_DISK_SPACE_BYTES) {
            builder.down();
            builder.withDetail("diskSpace", Health.down()
                .withDetail("error", "Free disk space below threshold: "
                    + formatBytes(freeBytes) + " < " + formatBytes(MIN_DISK_SPACE_BYTES))
                .build());
        }
    }

    private void checkEngineConnectivity(Health.Builder builder) {
        String host = ENGINE_HOST;
        int port = ENGINE_PORT;
        long start = System.currentTimeMillis();

        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(host, port), 3000); // 3s timeout
            long elapsed = System.currentTimeMillis() - start;
            builder.withDetail("provisionEngine", Health.up()
                .withDetail("host", host)
                .withDetail("port", port)
                .withDetail("latencyMs", elapsed)
                .build());
        } catch (Exception e) {
            builder.down();
            builder.withDetail("provisionEngine", Health.down()
                .withDetail("host", host)
                .withDetail("port", port)
                .withDetail("error", e.getMessage())
                .build());
        }
    }

    private static String formatBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        if (bytes < 1024L * 1024 * 1024) return String.format("%.1f MB", bytes / (1024.0 * 1024));
        return String.format("%.2f GB", bytes / (1024.0 * 1024 * 1024));
    }

    private static int parseIntOrDefault(String value, int defaultValue) {
        if (value == null || value.isBlank()) return defaultValue;
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }
}
