package com.cloudbuilder.shared.monitoring;

import com.zaxxer.hikari.HikariPoolMXBean;
import io.micrometer.core.aop.TimedAspect;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Meter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import io.micrometer.core.instrument.binder.MeterBinder;
import io.micrometer.core.instrument.binder.jvm.JvmGcMetrics;
import io.micrometer.core.instrument.binder.jvm.JvmMemoryMetrics;
import io.micrometer.core.instrument.binder.jvm.JvmThreadMetrics;
import io.micrometer.core.instrument.binder.system.FileDescriptorMetrics;
import io.micrometer.core.instrument.binder.system.ProcessorMetrics;
import io.micrometer.core.instrument.config.MeterFilter;
import io.micrometer.core.instrument.distribution.DistributionStatisticConfig;
import jakarta.annotation.PostConstruct;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.jdbc.DataSourceUnwrapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;
import java.time.Duration;

/**
 * Central Micrometer metrics configuration for CloudBuilder.
 * <p>
 * Registers:
 * <ul>
 *   <li>{@link TimedAspect} to enable {@code @Timed} annotation processing</li>
 *   <li>Common tags (application, environment) for all metrics</li>
 *   <li>JVM memory, GC, thread, and system-level metrics</li>
 *   <li>HikariCP connection pool gauges</li>
 *   <li>Custom API counters and timers</li>
 *   <li>Filters to suppress actuator noise from metrics</li>
 * </ul>
 * <p>
 * Micrometer metrics are exposed at {@code /actuator/prometheus} for Prometheus scraping.
 * Used by Grafana dashboards for the Four Golden Signals.
 */
@Configuration
public class MetricsConfig {

    private final MeterRegistry meterRegistry;
    private final Environment env;

    public MetricsConfig(MeterRegistry meterRegistry, Environment env) {
        this.meterRegistry = meterRegistry;
        this.env = env;
    }

    /**
     * Configures common tags and meter filters for all Micrometer metrics.
     * Replaces the removed {@code MeterRegistryCustomizer} from Micrometer 1.14+.
     */
    @PostConstruct
    public void configureCommonTags() {
        String activeProfile = String.join(",", env.getActiveProfiles());
        if (activeProfile.isBlank()) activeProfile = "dev";

        final String profile = activeProfile;
        meterRegistry.config()
            .commonTags(
                "application", "cloudbuilder",
                "environment", profile
            )
            // Suppress actuator health/info endpoints from HTTP metrics
            .meterFilter(MeterFilter.deny(id -> {
                String uri = id.getTag("uri");
                return uri != null && (
                    uri.equals("/actuator/health") ||
                    uri.equals("/actuator/info") ||
                    uri.equals("/actuator") ||
                    uri.equals("/actuator/prometheus")
                );
            }));
    }

    /**
     * Enables {@link io.micrometer.core.annotation.Timed @Timed} annotation processing.
     * Apply at class level for all endpoints in a controller, or method level for specific ones.
     */
    @Bean
    public TimedAspect timedAspect(MeterRegistry registry) {
        return new TimedAspect(registry);
    }

    // ── JVM Metrics ────────────────────────────────────────────────────

    @Bean
    public JvmMemoryMetrics jvmMemoryMetrics() {
        return new JvmMemoryMetrics();
    }

    @Bean
    public JvmGcMetrics jvmGcMetrics() {
        return new JvmGcMetrics();
    }

    @Bean
    public JvmThreadMetrics jvmThreadMetrics() {
        return new JvmThreadMetrics();
    }

    // ── System Metrics ─────────────────────────────────────────────────

    @Bean
    public ProcessorMetrics processorMetrics() {
        return new ProcessorMetrics();
    }

    @Bean
    public FileDescriptorMetrics fileDescriptorMetrics() {
        return new FileDescriptorMetrics();
    }

    // ── HikariCP Connection Pool Gauges ────────────────────────────────

    /**
     * Registers HikariCP pool metrics gauges:
     * <ul>
     *   <li>{@code hikaricp.connections.active} — currently active connections</li>
     *   <li>{@code hikaricp.connections.idle} — idle connections in pool</li>
     *   <li>{@code hikaricp.connections.pending} — threads awaiting connection</li>
     *   <li>{@code hikaricp.connections.total} — total connections in pool</li>
     * </ul>
     */
    @Bean
    public MeterBinder hikariMetrics(DataSource dataSource) {
        return registry -> {
            HikariPoolMXBean poolMXBean = DataSourceUnwrapper.unwrap(dataSource, HikariPoolMXBean.class);
            if (poolMXBean != null) {
                registry.gauge("hikaricp.connections.active", poolMXBean,
                    HikariPoolMXBean::getActiveConnections);
                registry.gauge("hikaricp.connections.idle", poolMXBean,
                    HikariPoolMXBean::getIdleConnections);
                registry.gauge("hikaricp.connections.pending", poolMXBean,
                    HikariPoolMXBean::getThreadsAwaitingConnection);
                registry.gauge("hikaricp.connections.total", poolMXBean,
                    HikariPoolMXBean::getTotalConnections);
            }
        };
    }

    // ── API-Level Metric Instruments ──────────────────────────────────

    /**
     * {@code api.requests.total} counter.
     * Incremented per request with {@code endpoint}, {@code method}, {@code status} tags
     * by {@link ControllerMicrometerAspect}.
     */
    @Bean
    public Counter apiRequestsTotal(MeterRegistry registry) {
        return Counter.builder("api.requests.total")
            .description("Total number of API requests")
            .register(registry);
    }

    /**
     * {@code api.request.duration} timer with percentile histograms.
     * Records request duration with {@code endpoint} tag.
     * Published percentiles: P50, P95, P99.
     * SLO boundaries: 50ms, 100ms, 200ms, 500ms, 1s, 2s.
     */
    @Bean
    public Timer apiRequestDuration(MeterRegistry registry) {
        return Timer.builder("api.request.duration")
            .description("API request duration")
            .publishPercentiles(0.5, 0.95, 0.99)
            .publishPercentileHistogram()
            .sla(
                Duration.ofMillis(50),
                Duration.ofMillis(100),
                Duration.ofMillis(200),
                Duration.ofMillis(500),
                Duration.ofSeconds(1),
                Duration.ofSeconds(2)
            )
            .register(registry);
    }
}
