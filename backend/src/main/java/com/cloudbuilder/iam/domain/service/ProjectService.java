package com.cloudbuilder.iam.domain.service;

import com.cloudbuilder.iam.domain.model.Project;
import com.cloudbuilder.iam.domain.port.OrganizationRepository;
import com.cloudbuilder.iam.domain.port.ProjectRepository;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final OrganizationRepository organizationRepository;

    public ProjectService(@Qualifier("iamProjectRepository") ProjectRepository projectRepository,
                          OrganizationRepository organizationRepository) {
        this.projectRepository = projectRepository;
        this.organizationRepository = organizationRepository;
    }

    @Transactional(readOnly = true)
    public Project getProject(String id) {
        return projectRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Projeto não encontrado: " + id));
    }

    public Project createProject(String organizationId, String name, String description) {
        organizationRepository.findById(organizationId)
            .orElseThrow(() -> new IllegalArgumentException("Organização não encontrada: " + organizationId));
        var project = new Project(organizationId, name, description);
        return projectRepository.save(project);
    }

    public Project updateProject(String id, String name, String description, String settings) {
        var project = getProject(id);
        if (name != null) project.setName(name);
        if (description != null) project.setDescription(description);
        if (settings != null) project.setSettings(settings);
        return projectRepository.save(project);
    }

    public Project deactivateProject(String id) {
        var project = getProject(id);
        project.setActive(false);
        return projectRepository.save(project);
    }

    public Project activateProject(String id) {
        var project = getProject(id);
        project.setActive(true);
        return projectRepository.save(project);
    }

    @Transactional(readOnly = true)
    public List<Project> listProjectsByOrganization(String organizationId) {
        return projectRepository.findByOrganizationId(organizationId);
    }

    @Transactional(readOnly = true)
    public List<Project> listActiveProjectsByOrganization(String organizationId) {
        return projectRepository.findByOrganizationIdAndActiveTrue(organizationId);
    }

    @Transactional(readOnly = true)
    public List<Project> searchProjects(String organizationId, String query) {
        return projectRepository.findByOrganizationIdAndNameContainingIgnoreCase(organizationId, query);
    }

    public void deleteProject(String id) {
        var project = getProject(id);
        projectRepository.delete(project);
    }
}
