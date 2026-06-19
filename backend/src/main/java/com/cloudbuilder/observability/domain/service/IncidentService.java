package com.cloudbuilder.observability.domain.service;

import com.cloudbuilder.observability.application.dto.IncidentDTO;
import com.cloudbuilder.observability.domain.model.IncidentEntity;
import com.cloudbuilder.observability.domain.port.ObserveIncidentRepository;
import com.cloudbuilder.observability.domain.port.IncidentTimelineRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service("observabilityIncidentService")
public class IncidentService {

    private final ObserveIncidentRepository incidentRepository;
    private final IncidentTimelineRepository timelineRepository;

    public IncidentService(ObserveIncidentRepository incidentRepository,
                           IncidentTimelineRepository timelineRepository) {
        this.incidentRepository = incidentRepository;
        this.timelineRepository = timelineRepository;
    }

    @Transactional
    public IncidentDTO acknowledge(String incidentId) {
        IncidentEntity incident = incidentRepository.findById(incidentId)
            .orElseThrow(() -> new IllegalArgumentException("Incident not found: " + incidentId));
        incident.setStatus("ACKNOWLEDGED");
        incident.setAcknowledgedAt(Instant.now());
        incidentRepository.save(incident);
        return toDto(incident);
    }

    @Transactional
    public IncidentDTO resolve(String incidentId) {
        IncidentEntity incident = incidentRepository.findById(incidentId)
            .orElseThrow(() -> new IllegalArgumentException("Incident not found: " + incidentId));
        incident.setStatus("RESOLVED");
        incident.setResolvedAt(Instant.now());
        incidentRepository.save(incident);
        return toDto(incident);
    }

    @Transactional(readOnly = true)
    public List<IncidentDTO> getActiveIncidents(String tenantId) {
        return incidentRepository.findByTenantIdAndStatus(tenantId, "OPEN").stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<IncidentDTO> getIncidentsByStatus(String tenantId, String status) {
        return incidentRepository.findByTenantIdAndStatus(tenantId, status).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    private IncidentDTO toDto(IncidentEntity e) {
        return new IncidentDTO(
            e.getId(), e.getAlertRuleId(), e.getTenantId(), e.getTitle(),
            e.getDescription(), e.getSeverity(), e.getStatus(),
            e.getCurrentValue(), e.getThreshold(), e.getStartedAt(),
            e.getAcknowledgedAt(), e.getResolvedAt()
        );
    }
}
