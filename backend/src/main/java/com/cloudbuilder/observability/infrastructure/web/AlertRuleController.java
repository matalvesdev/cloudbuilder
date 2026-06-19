package com.cloudbuilder.observability.infrastructure.web;

import com.cloudbuilder.observability.application.dto.AlertRuleDTO;
import com.cloudbuilder.observability.domain.model.AlertRuleEntity;
import com.cloudbuilder.observability.domain.port.AlertRuleRepository;
import com.cloudbuilder.shared.security.TenantContext;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/observability/alert-rules")
@PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
public class AlertRuleController {

    private final AlertRuleRepository repository;

    public AlertRuleController(AlertRuleRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'VIEWER')")
    public List<AlertRuleDTO> getAlertRules() {
        String tenantId = TenantContext.getTenantId();
        return repository.findByTenantId(tenantId).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    @PostMapping
    public AlertRuleDTO createAlertRule(@RequestBody AlertRuleDTO dto) {
        AlertRuleEntity entity = new AlertRuleEntity();
        entity.setTenantId(TenantContext.getTenantId());
        entity.setName(dto.name());
        entity.setDescription(dto.description());
        entity.setMetricName(dto.metricName());
        entity.setCondition(dto.condition());
        entity.setThreshold(dto.threshold());
        entity.setDurationSec(dto.durationSec());
        entity.setSeverity(dto.severity());
        entity.setEnabled(dto.enabled());
        entity.setNotifyChannels(dto.notifyChannels());
        entity.setCreatedAt(Instant.now());
        entity.setUpdatedAt(Instant.now());
        entity = repository.save(entity);
        return toDto(entity);
    }

    @PutMapping("/{id}")
    public AlertRuleDTO updateAlertRule(@PathVariable String id, @RequestBody AlertRuleDTO dto) {
        AlertRuleEntity entity = repository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Alert rule not found: " + id));
        entity.setName(dto.name());
        entity.setDescription(dto.description());
        entity.setMetricName(dto.metricName());
        entity.setCondition(dto.condition());
        entity.setThreshold(dto.threshold());
        entity.setDurationSec(dto.durationSec());
        entity.setSeverity(dto.severity());
        entity.setEnabled(dto.enabled());
        entity.setNotifyChannels(dto.notifyChannels());
        entity.setUpdatedAt(Instant.now());
        entity = repository.save(entity);
        return toDto(entity);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAlertRule(@PathVariable String id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private AlertRuleDTO toDto(AlertRuleEntity e) {
        return new AlertRuleDTO(
            e.getId(), e.getTenantId(), e.getName(), e.getDescription(),
            e.getMetricName(), e.getCondition(), e.getThreshold(), e.getDurationSec(),
            e.getSeverity(), e.isEnabled(), e.getNotifyChannels(),
            e.getCreatedAt(), e.getUpdatedAt()
        );
    }
}
