package com.cloudbuilder.observability.domain.service;

import com.cloudbuilder.observability.application.dto.LogEntryDTO;
import com.cloudbuilder.observability.domain.model.LogEntryEntity;
import com.cloudbuilder.observability.domain.port.LogEntryRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class LogService {

    private final LogEntryRepository repository;

    public LogService(LogEntryRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void ingest(LogEntryDTO entry) {
        LogEntryEntity entity = new LogEntryEntity(
            entry.tenantId(), entry.timestamp() != null ? entry.timestamp() : Instant.now(),
            entry.level(), entry.loggerName(), entry.threadName(),
            entry.message(), entry.traceId(), entry.spanId(),
            entry.stackTrace(), entry.structured()
        );
        repository.save(entity);
    }

    @Transactional
    public void ingestBatch(java.util.List<LogEntryDTO> entries) {
        for (LogEntryDTO entry : entries) {
            ingest(entry);
        }
    }

    @Transactional(readOnly = true)
    public Page<LogEntryDTO> search(String tenantId, String query, String level,
                                    Instant start, Instant end, Pageable pageable) {
        Page<LogEntryEntity> page;
        if (query != null && !query.isBlank()) {
            page = repository.fullTextSearch(tenantId, query, start, end, pageable);
        } else if (level != null && !level.isBlank()) {
            page = repository.findByTenantIdAndLevelAndTimestampBetweenOrderByTimestampDesc(
                tenantId, level, start, end, pageable);
        } else {
            page = repository.findByTenantIdAndTimestampBetweenOrderByTimestampDesc(
                tenantId, start, end, pageable);
        }

        return page.map(e -> new LogEntryDTO(
            e.getTenantId(), e.getTimestamp(), e.getLevel(), e.getLoggerName(),
            e.getThreadName(), e.getMessage(), e.getTraceId(), e.getSpanId(),
            e.getStackTrace(), e.getStructured()
        ));
    }
}
