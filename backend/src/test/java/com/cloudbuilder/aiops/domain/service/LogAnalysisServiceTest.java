package com.cloudbuilder.aiops.domain.service;

import com.cloudbuilder.aiops.domain.service.llm.LlmClient;
import com.cloudbuilder.observability.application.dto.LogEntryDTO;
import com.cloudbuilder.observability.domain.service.LogService;
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
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LogAnalysisServiceTest {

    @Mock
    private LogService logService;

    @Mock
    private LlmClient llmClient;

    private LogAnalysisService service;

    @BeforeEach
    void setUp() {
        service = new LogAnalysisService(logService, llmClient);
    }

    @Test
    void analyzeLogs_WithNoLogs_ShouldReturnEmptyAnalysis() {
        Page<LogEntryDTO> emptyPage = new PageImpl<>(List.of());
        when(logService.search(anyString(), isNull(), isNull(), any(Instant.class), any(Instant.class), any()))
            .thenReturn(emptyPage);

        var result = service.analyzeLogs("tenant-1", 60, 200);

        assertNotNull(result);
        assertEquals(0, result.totalLogs());
        assertEquals(0, result.errorCount());
        assertTrue(result.analysis().contains("Sem logs"));
    }

    @Test
    void analyzeLogs_WithLogs_ShouldComputeStatistics() {
        var now = Instant.now();
        var logs = List.of(
            createLog("INFO", "Request processed"),
            createLog("INFO", "Request processed"),
            createLog("ERROR", "Connection refused"),
            createLog("WARN", "Retry attempt 1"),
            createLog("INFO", "Request processed"),
            createLog("ERROR", "Timeout exceeded"),
            createLog("INFO", "Request processed"),
            createLog("INFO", "Request processed")
        );

        Page<LogEntryDTO> page = new PageImpl<>(logs);
        when(logService.search(anyString(), isNull(), isNull(), any(Instant.class), any(Instant.class), any()))
            .thenReturn(page);
        when(llmClient.chat(anyString(), anyString(), anyMap()))
            .thenReturn("Análise: 2 erros de 8 logs totais. Taxa de erro de 25%.");

        var result = service.analyzeLogs("tenant-1", 60, 200);

        assertEquals(8, result.totalLogs());
        assertEquals(2, result.errorCount());
        assertEquals(1, result.warnCount());
        assertEquals(25.0, result.errorRate(), 0.1);
        assertNotNull(result.analysis());
        assertNotNull(result.topErrorPatterns());
        assertNotNull(result.recommendations());
    }

    @Test
    void analyzeLogs_WithErrorPattern_ShouldDetectHighErrorRate() {
        var now = Instant.now();
        var logs = List.of(
            createLog("ERROR", "Connection refused"),
            createLog("ERROR", "Connection refused"),
            createLog("ERROR", "Connection refused"),
            createLog("ERROR", "Connection refused"),
            createLog("ERROR", "Connection refused"),
            createLog("ERROR", "Connection refused"),
            createLog("ERROR", "Connection refused"),
            createLog("ERROR", "Connection refused"),
            createLog("ERROR", "Connection refused"),
            createLog("ERROR", "Connection refused"),
            createLog("ERROR", "Connection refused")
        );

        Page<LogEntryDTO> page = new PageImpl<>(logs);
        when(logService.search(anyString(), isNull(), isNull(), any(Instant.class), any(Instant.class), any()))
            .thenReturn(page);
        when(llmClient.chat(anyString(), anyString(), anyMap()))
            .thenReturn("Taxa de erro muito alta. Investigar connectivity.");

        var result = service.analyzeLogs("tenant-1", 60, 200);

        assertEquals(11, result.totalLogs());
        assertEquals(11, result.errorCount());
        assertTrue(result.errorRate() > 10, "Error rate should be > 10%");
    }

    @Test
    void analyzeLogs_WithWarnings_ShouldCountCorrectly() {
        var logs = List.of(
            createLog("INFO", "Normal"),
            createLog("WARN", "Deprecated API usage"),
            createLog("WARN", "Retry in progress"),
            createLog("INFO", "Normal")
        );

        Page<LogEntryDTO> page = new PageImpl<>(logs);
        when(logService.search(anyString(), isNull(), isNull(), any(Instant.class), any(Instant.class), any()))
            .thenReturn(page);
        when(llmClient.chat(anyString(), anyString(), anyMap()))
            .thenReturn("OK");

        var result = service.analyzeLogs("tenant-1", 60, 200);

        assertEquals(4, result.totalLogs());
        assertEquals(0, result.errorCount());
        assertEquals(2, result.warnCount());
    }

    @Test
    void analyzeErrorPattern_ShouldSearchAndAnalyze() {
        var logs = List.of(
            createLog("ERROR", "Connection refused to database"),
            createLog("ERROR", "Connection refused to database")
        );

        Page<LogEntryDTO> page = new PageImpl<>(logs, PageRequest.of(0, 200), 2);
        when(logService.search(eq("tenant-1"), eq("database"), eq("ERROR"), any(Instant.class), any(Instant.class), any()))
            .thenReturn(page);
        when(llmClient.chat(anyString(), anyString(), anyMap()))
            .thenReturn("Padrão de erro de conexão com banco de dados detectado.");

        var result = service.analyzeErrorPattern("tenant-1", "database", 60, 200);

        assertEquals(2, result.totalLogs());
        assertNotNull(result.analysis());
    }

    private LogEntryDTO createLog(String level, String message) {
        return new LogEntryDTO(
            "tenant-1", Instant.now(), level, "com.test.Logger",
            "main", message, null, null, null, null
        );
    }
}
