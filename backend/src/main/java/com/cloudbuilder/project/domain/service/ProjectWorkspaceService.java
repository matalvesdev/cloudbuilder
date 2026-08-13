package com.cloudbuilder.project.domain.service;

import com.cloudbuilder.project.domain.model.Project;
import com.cloudbuilder.project.domain.port.ProjectRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProjectWorkspaceService {

    private final ProjectRepository projectRepo;

    public ProjectWorkspaceService(ProjectRepository projectRepo) {
        this.projectRepo = projectRepo;
    }

    @Transactional
    public Project createProject(String tenantId, String name, String description, String slug) {
        // Check for duplicate slug
        if (projectRepo.findByTenantIdAndSlug(tenantId, slug).isPresent()) {
            throw new RuntimeException("Project with slug already exists: " + slug);
        }

        // Check tenant limit
        long count = projectRepo.countByTenantIdAndStatus(tenantId, Project.ProjectStatus.ACTIVE);
        if (count >= 100) {
            throw new RuntimeException("Maximum projects per tenant reached");
        }

        Project project = new Project(tenantId, name, description, slug);
        return projectRepo.save(project);
    }

    public Page<Project> listProjects(String tenantId, Pageable pageable) {
        return projectRepo.findByTenantIdAndStatusOrderByCreatedAtDesc(
            tenantId, Project.ProjectStatus.ACTIVE, pageable);
    }

    public Project getProject(String id) {
        return projectRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Project not found"));
    }

    @Transactional
    public Project archiveProject(String id) {
        Project project = getProject(id);
        project.archive();
        return projectRepo.save(project);
    }

    @Transactional
    public Project activateProject(String id) {
        Project project = getProject(id);
        project.activate();
        return projectRepo.save(project);
    }
}
