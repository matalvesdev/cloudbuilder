package com.cloudbuilder.observability.domain.service;

import com.cloudbuilder.observability.application.dto.LogEntryDTO;
import com.cloudbuilder.observability.domain.model.LogEntryEntity;
import com.cloudbuilder.observability.domain.port.LogEntryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LogServiceTest {

    @Mock
    private LogEntryRepository repository;

    private LogService logService;

    @BeforeEach
    void setUp() {
        logService = new LogService(repository);
    }

    @Test
    void ingest_ShouldSaveEntry() {
        var entry = new LogEntryDTO("t1", Instant.now(), "ERROR", "MyLogger", "main",
                "Test error", "trace-1", "span-1", null, null);
        when(repository.save(any(LogEntryEntity.class))).thenAnswer(i -> i.getArgument(0));

        logService.ingest(entry);

        verify(repository).save(any(LogEntryEntity.class));
    }

    @Test
    void ingest_WithNullTimestamp_ShouldUseCurrentTime() {
        var entry = new LogEntryDTO("t1", null, "INFO", "Logger", "thread",
                "msg", "t1", "s1", null, null);
        when(repository.save(any(LogEntryEntity.class))).thenAnswer(i -> i.getArgument(0));

        logService.ingest(entry);

        verify(repository).save(any(LogEntryEntity.class));
    }

    @Test
    void ingestBatch_ShouldSaveAll() {
        var entries = List.of(
                new LogEntryDTO("t1", Instant.now(), "INFO", "L1", "t1", "m1", null, null, null, null),
                new LogEntryDTO("t1", Instant.now(), "WARN", "L2", "t2", "m2", null, null, null, null)
        );
        when(repository.save(any(LogEntryEntity.class))).thenAnswer(i -> i.getArgument(0));

        logService.ingestBatch(entries);

        verify(repository, times(2)).save(any(LogEntryEntity.class));
    }

    @Test
    void search_WithQuery_ShouldUseFullTextSearch() {
        var start = Instant.now().minusSeconds(3600);
        var end = Instant.now();
        var pageable = PageRequest.of(0, 20);
        var entity = new LogEntryEntity("t1", Instant.now(), "ERROR", "L1", "t1", "error occurred", null, null, null, null);
        when(repository.fullTextSearch("t1", "error", start, end, pageable))
                .thenReturn(new PageImpl<>(List.of(entity)));

        var result = logService.search("t1", "error", null, start, end, pageable);

        assertEquals(1, result.getTotalElements());
        verify(repository).fullTextSearch("t1", "error", start, end, pageable);
    }

    @Test
    void search_WithLevel_ShouldUseLevelFilter() {
        var start = Instant.now().minusSeconds(3600);
        var end = Instant.now();
        var pageable = PageRequest.of(0, 20);
        var entity = new LogEntryEntity("t1", Instant.now(), "ERROR", "L1", "t1", "err", null, null, null, null);
        when(repository.findByTenantIdAndLevelAndTimestampBetweenOrderByTimestampDesc("t1", "ERROR", start, end, pageable))
                .thenReturn(new PageImpl<>(List.of(entity)));

        var result = logService.search("t1", null, "ERROR", start, end, pageable);

        assertEquals(1, result.getTotalElements());
    }

    @Test
    void search_WithoutQueryOrLevel_ShouldUseDefault() {
        var start = Instant.now().minusSeconds(3600);
        var end = Instant.now();
        var pageable = PageRequest.of(0, 20);
        when(repository.findByTenantIdAndTimestampBetweenOrderByTimestampDesc("t1", start, end, pageable))
                .thenReturn(Page.empty());

        var result = logService.search("t1", null, null, start, end, pageable);

        assertTrue(result.isEmpty());
    }
}
