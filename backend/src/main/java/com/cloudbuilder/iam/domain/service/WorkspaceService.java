package com.cloudbuilder.iam.domain.service;

import com.cloudbuilder.iam.application.dto.WorkspaceDTO;
import com.cloudbuilder.iam.domain.model.Workspace;
import com.cloudbuilder.iam.domain.port.WorkspaceRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;

    public WorkspaceService(WorkspaceRepository workspaceRepository) {
        this.workspaceRepository = workspaceRepository;
    }

    public List<WorkspaceDTO> listByOrganization(String organizationId) {
        return workspaceRepository.findByOrganizationId(organizationId)
            .stream()
            .map(WorkspaceDTO::fromEntity)
            .toList();
    }

    public WorkspaceDTO getById(String id) {
        Workspace workspace = workspaceRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        return WorkspaceDTO.fromEntity(workspace);
    }

    public WorkspaceDTO create(String organizationId, String name, String description) {
        Workspace workspace = new Workspace(organizationId, name, description);
        return WorkspaceDTO.fromEntity(workspaceRepository.save(workspace));
    }

    public WorkspaceDTO update(String id, String name, String description, String settings) {
        Workspace workspace = workspaceRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        if (name != null) workspace.setName(name);
        if (description != null) workspace.setDescription(description);
        if (settings != null) workspace.setSettings(settings);
        return WorkspaceDTO.fromEntity(workspaceRepository.save(workspace));
    }

    public void deactivate(String id) {
        Workspace workspace = workspaceRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Workspace not found"));
        workspace.setActive(false);
        workspaceRepository.save(workspace);
    }

    public void delete(String id) {
        workspaceRepository.deleteById(id);
    }
}
