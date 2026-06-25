package com.cloudbuilder.observability.infrastructure.web;

import com.cloudbuilder.observability.application.dto.NotificationChannelDTO;
import com.cloudbuilder.observability.domain.model.NotificationChannelEntity;
import com.cloudbuilder.observability.domain.port.NotificationChannelRepository;
import com.cloudbuilder.shared.security.TenantContext;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/observability/notification-channels")
@PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
public class NotificationChannelController {

    private final NotificationChannelRepository repository;

    public NotificationChannelController(NotificationChannelRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'VIEWER')")
    public List<NotificationChannelDTO> getChannels() {
        String tenantId = TenantContext.getTenantId();
        return repository.findByTenantIdAndEnabledTrue(tenantId).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    @PostMapping
    public NotificationChannelDTO createChannel(@RequestBody NotificationChannelDTO dto) {
        NotificationChannelEntity entity = new NotificationChannelEntity();
        entity.setTenantId(TenantContext.getTenantId());
        entity.setName(dto.name());
        entity.setType(dto.type());
        entity.setEnabled(dto.enabled());
        entity = repository.save(entity);
        return toDto(entity);
    }

    @PutMapping("/{id}")
    public NotificationChannelDTO updateChannel(@PathVariable String id, @RequestBody NotificationChannelDTO dto) {
        NotificationChannelEntity entity = repository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Notification channel not found: " + id));
        entity.setName(dto.name());
        entity.setType(dto.type());
        entity.setEnabled(dto.enabled());
        entity = repository.save(entity);
        return toDto(entity);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteChannel(@PathVariable String id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private NotificationChannelDTO toDto(NotificationChannelEntity e) {
        return new NotificationChannelDTO(
            e.getId(),
            e.getName(),
            e.getType(),
            e.isEnabled()
        );
    }
}
