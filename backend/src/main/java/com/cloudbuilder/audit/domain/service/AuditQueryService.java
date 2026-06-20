package com.cloudbuilder.audit.domain.service;

import com.cloudbuilder.audit.domain.model.AuditEvent;
import com.cloudbuilder.audit.domain.port.AuditEventRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AuditQueryService {

    private final AuditEventRepository repository;

    public AuditQueryService(AuditEventRepository repository) {
        this.repository = repository;
    }

    public List<AuditEvent> queryEvents(
            String tenantId,
            String userId,
            String action,
            String resourceType,
            LocalDate startDate,
            LocalDate endDate,
            int page,
            int size) {

        Instant start = (startDate != null)
                ? startDate.atStartOfDay(ZoneOffset.UTC).toInstant()
                : Instant.EPOCH;

        Instant end = (endDate != null)
                ? endDate.atTime(LocalTime.MAX).atZone(ZoneOffset.UTC).toInstant()
                : Instant.now();

        // Fetch paginated results from DB
        var pageable = PageRequest.of(page, size);
        List<AuditEvent> events = repository.findByTenantIdAndTimestampBetween(tenantId, start, end, pageable);

        // Apply in-memory filters for optional parameters
        return events.stream()
                .filter(e -> userId == null || userId.isBlank() || userId.equals(e.getUserId()))
                .filter(e -> action == null || action.isBlank() || action.equals(e.getAction()))
                .filter(e -> resourceType == null || resourceType.isBlank() || resourceType.equals(e.getResourceType()))
                .sorted(Comparator.comparing(AuditEvent::getTimestamp).reversed())
                .collect(Collectors.toList());
    }

    public long countEvents(
            String tenantId,
            String userId,
            String action,
            String resourceType,
            LocalDate startDate,
            LocalDate endDate) {

        Instant start = (startDate != null)
                ? startDate.atStartOfDay(ZoneOffset.UTC).toInstant()
                : Instant.EPOCH;

        Instant end = (endDate != null)
                ? endDate.atTime(LocalTime.MAX).atZone(ZoneOffset.UTC).toInstant()
                : Instant.now();

        long count = repository.countByTenantIdAndTimestampBetween(tenantId, start, end);

        // If additional filters are present, we need to fetch and count in-memory
        if ((userId != null && !userId.isBlank())
                || (action != null && !action.isBlank())
                || (resourceType != null && !resourceType.isBlank())) {
            List<AuditEvent> all = repository.findByTenantIdAndTimestampBetween(
                    tenantId, start, end, PageRequest.of(0, Integer.MAX_VALUE));
            return all.stream()
                    .filter(e -> userId == null || userId.isBlank() || userId.equals(e.getUserId()))
                    .filter(e -> action == null || action.isBlank() || action.equals(e.getAction()))
                    .filter(e -> resourceType == null || resourceType.isBlank() || resourceType.equals(e.getResourceType()))
                    .count();
        }

        return count;
    }
}
