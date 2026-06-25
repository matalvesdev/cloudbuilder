package com.cloudbuilder.analytics.domain.service;

import com.cloudbuilder.analytics.domain.model.AnalyticsEvent;
import com.cloudbuilder.analytics.domain.port.AnalyticsEventRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final AnalyticsEventRepository repository;

    public AnalyticsService(AnalyticsEventRepository repository) {
        this.repository = repository;
    }

    public AnalyticsEvent trackEvent(AnalyticsEvent event) {
        return repository.save(event);
    }

    public List<AnalyticsEvent> getEventsByTenant(String tenantId) {
        return repository.findByTenantIdOrderByTimestampDesc(tenantId);
    }

    public List<AnalyticsEvent> getEventsByTenantAndModule(String tenantId, String module) {
        return repository.findByTenantIdAndModuleOrderByTimestampDesc(tenantId, module);
    }

    public List<AnalyticsEvent> getEventsByDateRange(String tenantId, Instant start, Instant end) {
        return repository.findByTenantIdAndTimestampBetweenOrderByTimestampDesc(tenantId, start, end);
    }

    public Map<String, Long> getModuleUsage(String tenantId, int days) {
        Instant end = Instant.now();
        Instant start = end.minus(days, ChronoUnit.DAYS);
        List<Object[]> results = repository.countByModule(tenantId, start, end);
        return results.stream()
                .collect(Collectors.toMap(
                        r -> (String) r[0],
                        r -> (Long) r[1],
                        (a, b) -> a + b,
                        LinkedHashMap::new
                ));
        }

    public Map<String, Long> getUserActivity(String tenantId, int days) {
        Instant end = Instant.now();
        Instant start = end.minus(days, ChronoUnit.DAYS);
        List<Object[]> results = repository.countByUser(tenantId, start, end);
        return results.stream()
                .collect(Collectors.toMap(
                        r -> (String) r[0],
                        r -> (Long) r[1],
                        (a, b) -> a + b,
                        LinkedHashMap::new
                ));
    }

    public long getEventCount(String tenantId, String module, int days) {
        Instant end = Instant.now();
        Instant start = end.minus(days, ChronoUnit.DAYS);
        return repository.countByTenantIdAndModuleAndTimestampBetween(tenantId, module, start, end);
    }
}
