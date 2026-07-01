package com.cloudbuilder.iam.domain.service;

import com.cloudbuilder.iam.domain.model.Team;
import com.cloudbuilder.iam.domain.port.OrganizationRepository;
import com.cloudbuilder.iam.domain.port.TeamRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class TeamService {

    private final TeamRepository teamRepository;
    private final OrganizationRepository organizationRepository;

    public TeamService(TeamRepository teamRepository,
                       OrganizationRepository organizationRepository) {
        this.teamRepository = teamRepository;
        this.organizationRepository = organizationRepository;
    }

    @Transactional(readOnly = true)
    public Team getTeam(String id) {
        return teamRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Time não encontrado: " + id));
    }

    public Team createTeam(String organizationId, String name, String description) {
        // Verify org exists
        organizationRepository.findById(organizationId)
            .orElseThrow(() -> new IllegalArgumentException("Organização não encontrada: " + organizationId));
        var team = new Team(organizationId, name, description);
        return teamRepository.save(team);
    }

    public Team updateTeam(String id, String name, String description) {
        var team = getTeam(id);
        if (name != null) team.setName(name);
        if (description != null) team.setDescription(description);
        return teamRepository.save(team);
    }

    public void deleteTeam(String id) {
        var team = getTeam(id);
        teamRepository.delete(team);
    }

    @Transactional(readOnly = true)
    public List<Team> listTeamsByOrganization(String organizationId) {
        return teamRepository.findByOrganizationId(organizationId);
    }

    @Transactional(readOnly = true)
    public List<Team> searchTeams(String organizationId, String query) {
        return teamRepository.findByOrganizationIdAndNameContainingIgnoreCase(organizationId, query);
    }
}
