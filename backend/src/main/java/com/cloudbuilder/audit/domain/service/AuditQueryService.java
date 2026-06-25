package com.cloudbuilder.audit.domain.service;

import com.cloudbuilder.audit.domain.model.AuditEvent;
import com.cloudbuilder.audit.domain.port.AuditEventRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.List;

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

        Instant start = toStartInstant(startDate);
        Instant end = toEndInstant(endDate);

        Specification<AuditEvent> spec = AuditEventSpecifications.withFilters(
                tenantId, userId, action, resourceType, start, end);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        return repository.findAll(spec, pageable).getContent();
    }

    public long countEvents(
            String tenantId,
            String userId,
            String action,
            String resourceType,
            LocalDate startDate,
            LocalDate endDate) {

        Instant start = toStartInstant(startDate);
        Instant end = toEndInstant(endDate);

        Specification<AuditEvent> spec = AuditEventSpecifications.withFilters(
                tenantId, userId, action, resourceType, start, end);

        return repository.count(spec);
    }

    private static Instant toStartInstant(LocalDate startDate) {
        return (startDate != null)
                ? startDate.atStartOfDay(ZoneOffset.UTC).toInstant()
                : Instant.EPOCH;
    }

    private static Instant toEndInstant(LocalDate endDate) {
        return (endDate != null)
                ? endDate.atTime(LocalTime.MAX).atZone(ZoneOffset.UTC).toInstant()
                : Instant.now();
    }
}
