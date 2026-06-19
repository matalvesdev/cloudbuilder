package com.cloudbuilder.observability.domain.service;

import com.cloudbuilder.observability.application.dto.DashboardDTO;
import com.cloudbuilder.observability.domain.model.DashboardEntity;
import com.cloudbuilder.observability.domain.port.DashboardRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final DashboardRepository repository;

    public DashboardService(DashboardRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<DashboardDTO> getDashboards(String tenantId) {
        return repository.findByTenantId(tenantId).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    @Transactional
    public DashboardDTO createDashboard(DashboardDTO dto) {
        DashboardEntity entity = new DashboardEntity();
        entity.setTenantId(dto.name());
        entity.setName(dto.name());
        entity.setDescription(dto.description());
        entity.setDefinition(dto.definition());
        entity.setDefault(dto.isDefault());
        entity = repository.save(entity);
        return toDto(entity);
    }

    @Transactional
    public void deleteDashboard(String id) {
        repository.deleteById(id);
    }

    private DashboardDTO toDto(DashboardEntity e) {
        return new DashboardDTO(
            e.getId(), e.getName(), e.getDescription(),
            e.getDefinition(), e.isDefault()
        );
    }
}
