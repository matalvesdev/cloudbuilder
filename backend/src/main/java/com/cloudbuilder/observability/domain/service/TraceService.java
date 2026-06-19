package com.cloudbuilder.observability.domain.service;

import com.cloudbuilder.observability.application.dto.SpanDTO;
import com.cloudbuilder.observability.application.dto.TraceDTO;
import com.cloudbuilder.observability.domain.model.SpanEntity;
import com.cloudbuilder.observability.domain.model.TraceEntity;
import com.cloudbuilder.observability.domain.port.SpanRepository;
import com.cloudbuilder.observability.domain.port.TraceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class TraceService {

    private final TraceRepository traceRepository;
    private final SpanRepository spanRepository;

    public TraceService(TraceRepository traceRepository, SpanRepository spanRepository) {
        this.traceRepository = traceRepository;
        this.spanRepository = spanRepository;
    }

    @Transactional
    public TraceDTO createTrace(String traceId, String tenantId, String serviceName,
                                String operation, long durationMs, int statusCode,
                                boolean isError, Map<String, String> metadata) {
        String metadataJson = metadata != null && !metadata.isEmpty() ? toJson(metadata) : "{}";
        TraceEntity entity = new TraceEntity(traceId, tenantId, serviceName, operation,
            Instant.now(), (int) durationMs, statusCode, isError, metadataJson);
        traceRepository.save(entity);
        return toDto(entity, List.of());
    }

    @Transactional
    public void addSpan(String traceId, String spanId, String parentSpanId, String tenantId,
                        String serviceName, String operation, long durationMs,
                        int statusCode, String status, Map<String, String> tags) {
        String tagsJson = tags != null && !tags.isEmpty() ? toJson(tags) : "{}";
        SpanEntity entity = new SpanEntity(traceId, spanId, parentSpanId, tenantId,
            serviceName, operation, Instant.now(), (int) durationMs,
            statusCode, status, tagsJson);
        spanRepository.save(entity);
    }

    @Transactional(readOnly = true)
    public List<TraceDTO> getTraces(String tenantId, Instant start, Instant end, boolean onlyErrors) {
        List<TraceEntity> traces;
        if (onlyErrors) {
            traces = traceRepository.findByTenantIdAndIsErrorTrueOrderByStartTimeDesc(tenantId);
        } else {
            traces = traceRepository.findByTenantIdAndStartTimeBetweenOrderByStartTimeDesc(tenantId, start, end);
        }
        return traces.stream()
            .map(t -> {
                List<SpanEntity> spans = spanRepository.findByTraceIdOrderByStartTimeAsc(t.getTraceId());
                return toDto(t, spans);
            })
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TraceDTO getTraceDetail(String traceId) {
        TraceEntity trace = traceRepository.findByTraceId(traceId)
            .orElseThrow(() -> new IllegalArgumentException("Trace not found: " + traceId));
        List<SpanEntity> spans = spanRepository.findByTraceIdOrderByStartTimeAsc(traceId);
        return toDto(trace, spans);
    }

    private TraceDTO toDto(TraceEntity entity, List<SpanEntity> spans) {
        List<SpanDTO> spanDTOs = spans.stream()
            .map(s -> new SpanDTO(s.getSpanId(), s.getOperation(), s.getServiceName(),
                s.getStartTime().toEpochMilli(), s.getDurationMs(),
                s.getStatusCode() != null ? s.getStatusCode() : 0, s.getStatus()))
            .collect(Collectors.toList());

        return new TraceDTO(
            entity.getTraceId(),
            entity.getServiceName(),
            entity.getOperation(),
            entity.getStartTime().toEpochMilli(),
            entity.getDurationMs(),
            entity.getStatusCode(),
            entity.isError(),
            spanDTOs
        );
    }

    private String toJson(Map<String, String> map) {
        return map.entrySet().stream()
            .map(e -> "\"" + e.getKey().replace("\"", "\\\"") + "\":\"" + e.getValue().replace("\"", "\\\"") + "\"")
            .collect(Collectors.joining(",", "{", "}"));
    }
}
