package com.cloudbuilder.audit.domain.service;

import com.cloudbuilder.audit.domain.model.AuditEvent;
import com.cloudbuilder.audit.domain.port.AuditEventRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AuditReportExportService {

    private final AuditEventRepository repository;
    private final ObjectMapper objectMapper;

    public AuditReportExportService(AuditEventRepository repository) {
        this.repository = repository;
        this.objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    public String exportCsv(
            String tenantId, String userId, String action,
            LocalDate startDate, LocalDate endDate) {

        List<AuditEvent> events = fetchFilteredEvents(tenantId, userId, action, startDate, endDate);

        StringBuilder csv = new StringBuilder();
        csv.append("id,tenantId,userId,action,resourceType,resourceId,details,ipAddress,timestamp\n");

        for (var event : events) {
            csv.append(escapeCsv(event.getId())).append(",");
            csv.append(escapeCsv(event.getTenantId())).append(",");
            csv.append(escapeCsv(event.getUserId())).append(",");
            csv.append(escapeCsv(event.getAction())).append(",");
            csv.append(escapeCsv(event.getResourceType())).append(",");
            csv.append(escapeCsv(event.getResourceId())).append(",");
            csv.append(escapeCsv(event.getDetails())).append(",");
            csv.append(escapeCsv(event.getIpAddress())).append(",");
            csv.append(event.getTimestamp().toString()).append("\n");
        }

        return csv.toString();
    }

    public String exportJson(
            String tenantId, String userId, String action,
            LocalDate startDate, LocalDate endDate) throws JsonProcessingException {

        List<AuditEvent> events = fetchFilteredEvents(tenantId, userId, action, startDate, endDate);

        var exportList = events.stream()
                .map(e -> new AuditEventExport(
                        e.getId(), e.getTenantId(), e.getUserId(), e.getAction(),
                        e.getResourceType(), e.getResourceId(), e.getDetails(),
                        e.getIpAddress(), e.getTimestamp()))
                .collect(Collectors.toList());

        return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(exportList);
    }

    private List<AuditEvent> fetchFilteredEvents(
            String tenantId, String userId, String action,
            LocalDate startDate, LocalDate endDate) {

        Instant start = (startDate != null)
                ? startDate.atStartOfDay(ZoneOffset.UTC).toInstant()
                : Instant.EPOCH;

        Instant end = (endDate != null)
                ? endDate.atTime(LocalTime.MAX).atZone(ZoneOffset.UTC).toInstant()
                : Instant.now();

        List<AuditEvent> events = repository.findByTenantIdAndTimestampBetween(
                tenantId, start, end, PageRequest.of(0, Integer.MAX_VALUE));

        return events.stream()
                .filter(e -> userId == null || userId.isBlank() || userId.equals(e.getUserId()))
                .filter(e -> action == null || action.isBlank() || action.equals(e.getAction()))
                .collect(Collectors.toList());
    }

    private String escapeCsv(String value) {
        if (value == null) {
            return "";
        }
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    record AuditEventExport(
            String id,
            String tenantId,
            String userId,
            String action,
            String resourceType,
            String resourceId,
            String details,
            String ipAddress,
            Instant timestamp
    ) {}
}
