package com.cloudbuilder.iam.domain.service;

import com.cloudbuilder.iam.domain.model.Squad;
import com.cloudbuilder.iam.domain.port.OrganizationRepository;
import com.cloudbuilder.iam.domain.port.SquadRepository;
import com.cloudbuilder.iam.domain.port.WorkspaceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class SquadService {

    private final SquadRepository squadRepository;
    private final OrganizationRepository organizationRepository;
    private final WorkspaceRepository workspaceRepository;

    public SquadService(SquadRepository squadRepository,
                        OrganizationRepository organizationRepository,
                        WorkspaceRepository workspaceRepository) {
        this.squadRepository = squadRepository;
        this.organizationRepository = organizationRepository;
        this.workspaceRepository = workspaceRepository;
    }

    @Transactional(readOnly = true)
    public Squad getSquad(String id) {
        return squadRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Squad não encontrado: " + id));
    }

    public Squad createSquad(String organizationId, String workspaceId, String tenantId, String name, String description, String leadId) {
        organizationRepository.findById(organizationId)
            .orElseThrow(() -> new IllegalArgumentException("Organização não encontrada: " + organizationId));
        workspaceRepository.findById(workspaceId)
            .orElseThrow(() -> new IllegalArgumentException("Workspace não encontrado: " + workspaceId));
        var squad = new Squad(workspaceId, tenantId, name, description);
        if (leadId != null) {
            squad.setLeadId(leadId);
        }
        return squadRepository.save(squad);
    }

    public Squad updateSquad(String id, String name, String description, String leadId) {
        var squad = getSquad(id);
        if (name != null) squad.setName(name);
        if (description != null) squad.setDescription(description);
        if (leadId != null) squad.setLeadId(leadId);
        return squadRepository.save(squad);
    }

    public void deleteSquad(String id) {
        var squad = getSquad(id);
        squadRepository.delete(squad);
    }

    @Transactional(readOnly = true)
    public List<Squad> listSquadsByWorkspace(String workspaceId) {
        return squadRepository.findByWorkspaceId(workspaceId);
    }

    @Transactional(readOnly = true)
    public List<Squad> searchSquads(String workspaceId, String query) {
        return squadRepository.findByWorkspaceIdAndNameContainingIgnoreCase(workspaceId, query);
    }

    @Transactional(readOnly = true)
    public long countSquads(String workspaceId) {
        return squadRepository.countByWorkspaceId(workspaceId);
    }
}
