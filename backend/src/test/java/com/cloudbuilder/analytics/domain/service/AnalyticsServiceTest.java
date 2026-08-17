package com.cloudbuilder.analytics.domain.service;

import com.cloudbuilder.analytics.domain.model.AnalyticsEvent;
import com.cloudbuilder.analytics.domain.port.AnalyticsEventRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AnalyticsService Tests")
class AnalyticsServiceTest {

    @Mock
    private AnalyticsEventRepository repository;

    @InjectMocks
    private AnalyticsService analyticsService;

    private AnalyticsEvent createEvent(String module, String action) {
        return new AnalyticsEvent("USER_ACTION", "user-1", "tenant-1", module, action);
    }

    @Test
    @DisplayName("trackEvent - saves and returns event")
    void trackEvent_savesAndReturns() {
        AnalyticsEvent event = createEvent("canvas", "create_node");
        when(repository.save(event)).thenReturn(event);

        AnalyticsEvent result = analyticsService.trackEvent(event);

        assertThat(result).isNotNull();
        assertThat(result.getModule()).isEqualTo("canvas");
        assertThat(result.getAction()).isEqualTo("create_node");
        verify(repository).save(event);
    }

    @Test
    @DisplayName("getEventsByTenant - returns events")
    void getEventsByTenant_returnsEvents() {
        List<AnalyticsEvent> events = List.of(
            createEvent("canvas", "create"),
            createEvent("provision", "apply")
        );
        when(repository.findByTenantIdOrderByTimestampDesc("tenant-1")).thenReturn(events);

        List<AnalyticsEvent> result = analyticsService.getEventsByTenant("tenant-1");

        assertThat(result).hasSize(2);
        verify(repository).findByTenantIdOrderByTimestampDesc("tenant-1");
    }

    @Test
    @DisplayName("getEventsByTenant - returns empty for unknown tenant")
    void getEventsByTenant_empty() {
        when(repository.findByTenantIdOrderByTimestampDesc("unknown")).thenReturn(List.of());

        List<AnalyticsEvent> result = analyticsService.getEventsByTenant("unknown");

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getEventsByTenantAndModule - filters by module")
    void getEventsByTenantAndModule_filtersByModule() {
        List<AnalyticsEvent> events = List.of(createEvent("canvas", "create"));
        when(repository.findByTenantIdAndModuleOrderByTimestampDesc("tenant-1", "canvas"))
            .thenReturn(events);

        List<AnalyticsEvent> result = analyticsService.getEventsByTenantAndModule("tenant-1", "canvas");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getModule()).isEqualTo("canvas");
    }

    @Test
    @DisplayName("getEventsByDateRange - returns events in range")
    void getEventsByDateRange_returnsEventsInRange() {
        Instant start = Instant.now().minus(1, ChronoUnit.DAYS);
        Instant end = Instant.now();
        List<AnalyticsEvent> events = List.of(createEvent("canvas", "edit"));
        when(repository.findByTenantIdAndTimestampBetweenOrderByTimestampDesc("tenant-1", start, end))
            .thenReturn(events);

        List<AnalyticsEvent> result = analyticsService.getEventsByDateRange("tenant-1", start, end);

        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("getModuleUsage - returns module counts")
    void getModuleUsage_returnsModuleCounts() {
        List<Object[]> results = new java.util.ArrayList<>();
        results.add(new Object[]{"canvas", 15L});
        results.add(new Object[]{"provision", 8L});
        when(repository.countByModule(eq("tenant-1"), any(Instant.class), any(Instant.class)))
            .thenReturn(results);

        Map<String, Long> usage = analyticsService.getModuleUsage("tenant-1", 30);

        assertThat(usage).containsEntry("canvas", 15L);
        assertThat(usage).containsEntry("provision", 8L);
        assertThat(usage).hasSize(2);
    }

    @Test
    @DisplayName("getModuleUsage - returns empty map when no data")
    void getModuleUsage_empty() {
        when(repository.countByModule(eq("tenant-1"), any(Instant.class), any(Instant.class)))
            .thenReturn(List.of());

        Map<String, Long> usage = analyticsService.getModuleUsage("tenant-1", 7);

        assertThat(usage).isEmpty();
    }

    @Test
    @DisplayName("getUserActivity - returns user counts")
    void getUserActivity_returnsUserCounts() {
        List<Object[]> results = new java.util.ArrayList<>();
        results.add(new Object[]{"user-1", 20L});
        results.add(new Object[]{"user-2", 5L});
        when(repository.countByUser(eq("tenant-1"), any(Instant.class), any(Instant.class)))
            .thenReturn(results);

        Map<String, Long> activity = analyticsService.getUserActivity("tenant-1", 30);

        assertThat(activity).containsEntry("user-1", 20L);
        assertThat(activity).containsEntry("user-2", 5L);
    }

    @Test
    @DisplayName("getUserActivity - returns empty when no activity")
    void getUserActivity_empty() {
        when(repository.countByUser(eq("tenant-1"), any(Instant.class), any(Instant.class)))
            .thenReturn(List.of());

        Map<String, Long> activity = analyticsService.getUserActivity("tenant-1", 7);

        assertThat(activity).isEmpty();
    }

    @Test
    @DisplayName("getEventCount - returns count for module")
    void getEventCount_returnsCount() {
        when(repository.countByTenantIdAndModuleAndTimestampBetween(
            eq("tenant-1"), eq("canvas"), any(Instant.class), any(Instant.class)))
            .thenReturn(42L);

        long count = analyticsService.getEventCount("tenant-1", "canvas", 30);

        assertThat(count).isEqualTo(42L);
    }

    @Test
    @DisplayName("getEventCount - returns zero when no events")
    void getEventCount_zero() {
        when(repository.countByTenantIdAndModuleAndTimestampBetween(
            eq("tenant-1"), eq("nonexistent"), any(Instant.class), any(Instant.class)))
            .thenReturn(0L);

        long count = analyticsService.getEventCount("tenant-1", "nonexistent", 30);

        assertThat(count).isZero();
    }
}
