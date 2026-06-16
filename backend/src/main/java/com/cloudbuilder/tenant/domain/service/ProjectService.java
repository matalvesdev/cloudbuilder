package com.cloudbuilder.tenant.domain.service;

import com.cloudbuilder.tenant.domain.model.Project;
import com.cloudbuilder.tenant.domain.model.ProjectMember;
import com.cloudbuilder.tenant.domain.port.ProjectMemberRepository;
import com.cloudbuilder.tenant.domain.port.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;

    public ProjectService(ProjectRepository projectRepository,
                           ProjectMemberRepository memberRepository) {
        this.projectRepository = projectRepository;
        this.memberRepository = memberRepository;
    }

    public Project createProject(String tenantId, String name, String description,
                                  String ownerUserId, String ownerName, String ownerEmail) {
        Project project = new Project(tenantId, name, description);
        project = projectRepository.save(project);

        ProjectMember owner = new ProjectMember(
                project.getId(), ownerUserId, ownerName, ownerEmail, ProjectMember.ROLE_OWNER);
        memberRepository.save(owner);

        return project;
    }

    public List<Project> getProjectsByTenant(String tenantId) {
        return projectRepository.findByTenantIdAndIsActiveTrue(tenantId);
    }

    public Optional<Project> getById(UUID id) {
        return projectRepository.findById(id);
    }

    public Project updateProject(UUID id, String name, String description) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + id));
        if (name != null) project.setName(name);
        if (description != null) project.setDescription(description);
        return projectRepository.save(project);
    }

    public void deleteProject(UUID id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + id));
        project.deactivate();
        projectRepository.save(project);
    }

    public ProjectMember inviteMember(UUID projectId, String userId, String userName,
                                       String userEmail, String role) {
        if (!List.of(ProjectMember.ROLE_ADMIN, ProjectMember.ROLE_MEMBER, ProjectMember.ROLE_VIEWER)
                .contains(role)) {
            throw new IllegalArgumentException("Invalid role: " + role);
        }

        Optional<ProjectMember> existing = memberRepository.findByProjectIdAndUserId(projectId, userId);
        if (existing.isPresent()) {
            throw new IllegalStateException("User is already a member of this project");
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        ProjectMember member = new ProjectMember(projectId, userId, userName, userEmail, role);
        member = memberRepository.save(member);

        project.incrementMemberCount();
        projectRepository.save(project);

        return member;
    }

    public void removeMember(UUID projectId, String userId) {
        ProjectMember member = memberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found"));

        if (ProjectMember.ROLE_OWNER.equals(member.getRole())) {
            throw new IllegalStateException("Cannot remove the project owner");
        }

        memberRepository.deleteByProjectIdAndUserId(projectId, userId);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));
        project.decrementMemberCount();
        projectRepository.save(project);
    }

    public ProjectMember updateMemberRole(UUID projectId, String userId, String newRole) {
        if (!List.of(ProjectMember.ROLE_ADMIN, ProjectMember.ROLE_MEMBER, ProjectMember.ROLE_VIEWER)
                .contains(newRole)) {
            throw new IllegalArgumentException("Invalid role: " + newRole);
        }

        ProjectMember member = memberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found"));

        if (ProjectMember.ROLE_OWNER.equals(member.getRole())) {
            throw new IllegalStateException("Cannot change the project owner's role");
        }

        member.setRole(newRole);
        return memberRepository.save(member);
    }

    public List<ProjectMember> getMembers(UUID projectId) {
        return memberRepository.findByProjectId(projectId);
    }

    public List<ProjectMember> getUserProjects(String userId) {
        return memberRepository.findByUserId(userId);
    }
}
