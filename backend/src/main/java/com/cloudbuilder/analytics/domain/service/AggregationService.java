package com.cloudbuilder.analytics.domain.service;

import com.cloudbuilder.analytics.domain.model.AnalyticsEvent;
import com.cloudbuilder.analytics.domain.model.AnalyticsRollupDaily;
import com.cloudbuilder.analytics.domain.model.AnalyticsRollupMonthly;
import com.cloudbuilder.analytics.domain.model.AnalyticsUserRollupDaily;
import com.cloudbuilder.analytics.domain.port.AnalyticsEventRepository;
import com.cloudbuilder.analytics.domain.port.AnalyticsRollupDailyRepository;
import com.cloudbuilder.analytics.domain.port.AnalyticsRollupMonthlyRepository;
import com.cloudbuilder.analytics.domain.port.AnalyticsUserRollupDailyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Nightly aggregation service that pre-computes rollup tables from raw analytics events.
 *
 * Per ADR-024, runs daily at 00:30 UTC via @Scheduled.
 * Dashboard queries use rollup tables for time ranges > 1 day
 * and raw events for real-time data (≤ 1 day).
 */
@Service
public class AggregationService {

    private static final Logger log = LoggerFactory.getLogger(AggregationService.class);

    private final AnalyticsEventRepository eventRepository;
    private final AnalyticsRollupDailyRepository dailyRollupRepository;
    private final AnalyticsRollupMonthlyRepository monthlyRollupRepository;
    private final AnalyticsUserRollupDailyRepository userRollupRepository;

    public AggregationService(AnalyticsEventRepository eventRepository,
                              AnalyticsRollupDailyRepository dailyRollupRepository,
                              AnalyticsRollupMonthlyRepository monthlyRollupRepository,
                              AnalyticsUserRollupDailyRepository userRollupRepository) {
        this.eventRepository = eventRepository;
        this.dailyRollupRepository = dailyRollupRepository;
        this.monthlyRollupRepository = monthlyRollupRepository;
        this.userRollupRepository = userRollupRepository;
    }

    /**
     * Nightly aggregation: runs every day at 00:30 UTC.
     * Aggregates raw events into daily and monthly rollup tables.
     */
    @Scheduled(cron = "0 30 0 * * *")
    @Transactional
    public void aggregateDaily() {
        LocalDate yesterday = LocalDate.now(ZoneId.of("UTC")).minusDays(1);
        log.info("Starting daily analytics aggregation for date: {}", yesterday);

        Instant dayStart = yesterday.atStartOfDay(ZoneId.of("UTC")).toInstant();
        Instant dayEnd = yesterday.plusDays(1).atStartOfDay(ZoneId.of("UTC")).toInstant();

        // Find all events for yesterday — fetch all tenants via explicit tenant list
        // Cannot use "*" wildcard with Spring Data JPA; must query per tenant
        List<String> tenantIds = eventRepository.findDistinctTenantIds();
        if (tenantIds.isEmpty()) {
            log.info("No tenants with events to aggregate for date: {}", yesterday);
            return;
        }

        List<AnalyticsEvent> events = eventRepository
            .findByTenantIdInAndTimestampBetweenOrderByTimestampDesc(tenantIds, dayStart, dayEnd);

        if (events.isEmpty()) {
            log.info("No events to aggregate for date: {}", yesterday);
            return;
        }

        // Group by tenant
        Map<String, List<AnalyticsEvent>> byTenant = events.stream()
            .collect(Collectors.groupingBy(AnalyticsEvent::getTenantId));

        for (var entry : byTenant.entrySet()) {
            String tenantId = entry.getKey();
            List<AnalyticsEvent> tenantEvents = entry.getValue();

            // Aggregate module usage by (module, action)
            Map<String, Map<String, List<AnalyticsEvent>>> byModuleAction = tenantEvents.stream()
                .collect(Collectors.groupingBy(
                    AnalyticsEvent::getModule,
                    Collectors.groupingBy(AnalyticsEvent::getAction)
                ));

            for (var moduleEntry : byModuleAction.entrySet()) {
                String module = moduleEntry.getKey();
                for (var actionEntry : moduleEntry.getValue().entrySet()) {
                    String action = actionEntry.getKey();
                    List<AnalyticsEvent> actionEvents = actionEntry.getValue();

                    long uniqueUsers = actionEvents.stream()
                        .map(AnalyticsEvent::getUserId)
                        .distinct()
                        .count();

                    // Upsert daily rollup
                    var dailyOpt = dailyRollupRepository
                        .findByTenantIdAndModuleAndActionAndRollupDate(tenantId, module, action, yesterday);

                    if (dailyOpt.isPresent()) {
                        var existing = dailyOpt.get();
                        existing.setEventCount(existing.getEventCount() + actionEvents.size());
                        existing.setUniqueUsers(existing.getUniqueUsers() + uniqueUsers);
                        dailyRollupRepository.save(existing);
                    } else {
                        dailyRollupRepository.save(new AnalyticsRollupDaily(
                            tenantId, module, action, actionEvents.size(), uniqueUsers, yesterday));
                    }

                    // Update monthly rollup
                    LocalDate monthStart = yesterday.withDayOfMonth(1);
                    var monthlyOpt = monthlyRollupRepository
                        .findByTenantIdAndModuleAndActionAndRollupMonth(tenantId, module, action, monthStart);

                    if (monthlyOpt.isPresent()) {
                        var existing = monthlyOpt.get();
                        existing.setEventCount(existing.getEventCount() + actionEvents.size());
                        existing.setUniqueUsers(existing.getUniqueUsers() + uniqueUsers);
                        monthlyRollupRepository.save(existing);
                    } else {
                        monthlyRollupRepository.save(new AnalyticsRollupMonthly(
                            tenantId, module, action, actionEvents.size(), uniqueUsers, monthStart));
                    }
                }
            }

            // Aggregate user activity
            Map<String, Map<String, List<AnalyticsEvent>>> byUserModule = tenantEvents.stream()
                .collect(Collectors.groupingBy(
                    AnalyticsEvent::getUserId,
                    Collectors.groupingBy(AnalyticsEvent::getModule)
                ));

            for (var userEntry : byUserModule.entrySet()) {
                String userId = userEntry.getKey();
                for (var moduleEntry : userEntry.getValue().entrySet()) {
                    String module = moduleEntry.getKey();
                    List<AnalyticsEvent> moduleEvents = moduleEntry.getValue();

                    // Upsert user rollup to avoid constraint violation on re-run
                    Optional<AnalyticsUserRollupDaily> userOpt = userRollupRepository
                        .findByTenantIdAndUserIdAndModuleAndRollupDate(tenantId, userId, module, yesterday);
                    if (userOpt.isPresent()) {
                        var existing = userOpt.get();
                        existing.setEventCount(existing.getEventCount() + moduleEvents.size());
                        userRollupRepository.save(existing);
                    } else {
                        userRollupRepository.save(new AnalyticsUserRollupDaily(
                            tenantId, userId, module, moduleEvents.size(), yesterday));
                    }
                }
            }
        }

        log.info("Completed daily analytics aggregation for date: {}. Processed {} events.",
            yesterday, events.size());
    }

    /**
     * Cleanup old rollup data. Runs weekly on Sunday at 02:00 UTC.
     * Retains daily rollups for 90 days and user rollups for 90 days.
     * Cleans per tenant to avoid cross-tenant data loss.
     */
    @Scheduled(cron = "0 0 2 * * SUN")
    @Transactional
    public void cleanupOldRollups() {
        LocalDate cutoff = LocalDate.now(ZoneId.of("UTC")).minusDays(90);
        log.info("Cleaning up rollup data older than: {}", cutoff);

        // Delete per tenant to maintain tenant isolation
        List<String> tenantIds = eventRepository.findDistinctTenantIds();
        if (tenantIds.isEmpty()) {
            log.info("No tenants to clean up rollups for.");
            return;
        }

        for (String tenantId : tenantIds) {
            dailyRollupRepository.deleteByTenantIdAndRollupDateBefore(tenantId, cutoff);
            monthlyRollupRepository.deleteByTenantIdAndRollupMonthBefore(tenantId, cutoff.withDayOfMonth(1));
        }

        log.info("Cleanup complete for {} tenants.", tenantIds.size());
    }
}
