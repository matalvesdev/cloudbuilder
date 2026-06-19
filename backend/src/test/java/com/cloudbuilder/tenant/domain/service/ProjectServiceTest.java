package com.cloudbuilder.tenant.domain.service;

import com.cloudbuilder.tenant.domain.model.Project;
import com.cloudbuilder.tenant.domain.model.ProjectMember;
import com.cloudbuilder.tenant.domain.port.ProjectMemberRepository;
import com.cloudbuilder.tenant.domain.port.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProjectMemberRepository memberRepository;

    private ProjectService projectService;

    @BeforeEach
    void setUp() {
        projectService = new ProjectService(projectRepository, memberRepository);
    }

    @Test
    void createProject_ShouldSaveProjectAndOwner() {
        var project = new Project("tenant-1", "My Project", "Description");
        when(projectRepository.save(any(Project.class))).thenReturn(project);
        when(memberRepository.save(any(ProjectMember.class))).thenAnswer(i -> i.getArgument(0));

        var result = projectService.createProject("tenant-1", "My Project", "Description",
                "user-1", "Owner Name", "owner@email.com");

        assertNotNull(result);
        assertEquals("My Project", result.getName());
        verify(projectRepository).save(any(Project.class));
        verify(memberRepository).save(any(ProjectMember.class));
    }

    @Test
    void getProjectsByTenant_ShouldReturnActiveProjects() {
        var projects = List.of(
                new Project("tenant-1", "Project A", "Desc A"),
                new Project("tenant-1", "Project B", "Desc B")
        );
        when(projectRepository.findByTenantIdAndIsActiveTrue("tenant-1")).thenReturn(projects);

        var result = projectService.getProjectsByTenant("tenant-1");

        assertEquals(2, result.size());
        verify(projectRepository).findByTenantIdAndIsActiveTrue("tenant-1");
    }

    @Test
    void getById_WhenFound_ShouldReturnProject() {
        var project = new Project("t1", "Test", "Desc");
        var id = project.getId();
        when(projectRepository.findById(id)).thenReturn(Optional.of(project));

        var result = projectService.getById(id);

        assertTrue(result.isPresent());
        assertEquals("Test", result.get().getName());
    }

    @Test
    void getById_WhenNotFound_ShouldReturnEmpty() {
        var id = UUID.randomUUID().toString();
        when(projectRepository.findById(id)).thenReturn(Optional.empty());

        var result = projectService.getById(id);

        assertTrue(result.isEmpty());
    }

    @Test
    void updateProject_ShouldUpdateFields() {
        var project = new Project("t1", "Original", "Original Desc");
        var id = project.getId();
        when(projectRepository.findById(id)).thenReturn(Optional.of(project));
        when(projectRepository.save(any(Project.class))).thenAnswer(i -> i.getArgument(0));

        var result = projectService.updateProject(id, "New Name", "New Desc");

        assertEquals("New Name", result.getName());
        assertEquals("New Desc", result.getDescription());
        verify(projectRepository).findById(id);
        verify(projectRepository).save(project);
    }

    @Test
    void updateProject_WithNullFields_ShouldKeepExisting() {
        var project = new Project("t1", "Original", "Original Desc");
        var id = project.getId();
        when(projectRepository.findById(id)).thenReturn(Optional.of(project));
        when(projectRepository.save(any(Project.class))).thenAnswer(i -> i.getArgument(0));

        var result = projectService.updateProject(id, null, null);

        assertEquals("Original", result.getName());
        assertEquals("Original Desc", result.getDescription());
    }

    @Test
    void updateProject_WhenNotFound_ShouldThrow() {
        var id = UUID.randomUUID().toString();
        when(projectRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> projectService.updateProject(id, "Name", "Desc"));
    }

    @Test
    void deleteProject_ShouldDeactivate() {
        var project = new Project("t1", "Test", "Desc");
        var id = project.getId();
        assertTrue(project.isActive());

        when(projectRepository.findById(id)).thenReturn(Optional.of(project));
        when(projectRepository.save(any(Project.class))).thenAnswer(i -> i.getArgument(0));

        projectService.deleteProject(id);

        assertFalse(project.isActive());
        verify(projectRepository).save(project);
    }

    @Test
    void deleteProject_WhenNotFound_ShouldThrow() {
        var id = UUID.randomUUID().toString();
        when(projectRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> projectService.deleteProject(id));
    }

    @Test
    void inviteMember_ShouldAddMemberAndIncrementCount() {
        var project = new Project("t1", "P", "D");
        var projectId = project.getId();
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(memberRepository.findByProjectIdAndUserId(projectId, "user-2")).thenReturn(Optional.empty());
        when(memberRepository.save(any(ProjectMember.class))).thenAnswer(i -> i.getArgument(0));
        when(projectRepository.save(any(Project.class))).thenAnswer(i -> i.getArgument(0));

        var member = projectService.inviteMember(projectId, "user-2", "User 2", "u2@email.com", "member");

        assertNotNull(member);
        assertEquals("user-2", member.getUserId());
        assertEquals("member", member.getRole());
        assertEquals(2, project.getMemberCount());
        verify(memberRepository).save(any(ProjectMember.class));
        verify(projectRepository, times(1)).save(any(Project.class));
    }

    @Test
    void inviteMember_WithInvalidRole_ShouldThrow() {
        var projectId = UUID.randomUUID().toString();
        assertThrows(IllegalArgumentException.class,
                () -> projectService.inviteMember(projectId, "user-1", "U1", "u@e.com", "invalid_role"));
    }

    @Test
    void inviteMember_WhenAlreadyMember_ShouldThrow() {
        var projectId = UUID.randomUUID().toString();
        var existing = new ProjectMember(projectId, "user-1", "U1", "u@e.com", "member");
        when(memberRepository.findByProjectIdAndUserId(projectId, "user-1")).thenReturn(Optional.of(existing));

        assertThrows(IllegalStateException.class,
                () -> projectService.inviteMember(projectId, "user-1", "U1", "u@e.com", "member"));
    }

    @Test
    void inviteMember_WhenProjectNotFound_ShouldThrow() {
        var projectId = UUID.randomUUID().toString();
        when(memberRepository.findByProjectIdAndUserId(projectId, "user-1")).thenReturn(Optional.empty());
        when(projectRepository.findById(projectId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> projectService.inviteMember(projectId, "user-1", "U1", "u@e.com", "member"));
    }

    @Test
    void removeMember_ShouldDeleteAndDecrementCount() {
        var project = new Project("t1", "P", "D");
        var projectId = project.getId();
        var member = new ProjectMember(projectId, "user-2", "User 2", "u2@e.com", "member");
        when(memberRepository.findByProjectIdAndUserId(projectId, "user-2")).thenReturn(Optional.of(member));
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(projectRepository.save(any(Project.class))).thenAnswer(i -> i.getArgument(0));

        int beforeCount = project.getMemberCount();
        projectService.removeMember(projectId, "user-2");

        assertEquals(beforeCount - 1, project.getMemberCount());
        verify(memberRepository).deleteByProjectIdAndUserId(projectId, "user-2");
    }

    @Test
    void removeMember_WhenOwner_ShouldThrow() {
        var projectId = UUID.randomUUID().toString();
        var owner = new ProjectMember(projectId, "owner-1", "Owner", "o@e.com", ProjectMember.ROLE_OWNER);
        when(memberRepository.findByProjectIdAndUserId(projectId, "owner-1")).thenReturn(Optional.of(owner));

        assertThrows(IllegalStateException.class,
                () -> projectService.removeMember(projectId, "owner-1"));
    }

    @Test
    void removeMember_WhenNotFound_ShouldThrow() {
        var projectId = UUID.randomUUID().toString();
        when(memberRepository.findByProjectIdAndUserId(projectId, "unknown")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> projectService.removeMember(projectId, "unknown"));
    }

    @Test
    void updateMemberRole_ShouldUpdateAndSave() {
        var projectId = UUID.randomUUID().toString();
        var member = new ProjectMember(projectId, "user-1", "U1", "u@e.com", ProjectMember.ROLE_MEMBER);
        when(memberRepository.findByProjectIdAndUserId(projectId, "user-1")).thenReturn(Optional.of(member));
        when(memberRepository.save(any(ProjectMember.class))).thenAnswer(i -> i.getArgument(0));

        var result = projectService.updateMemberRole(projectId, "user-1", ProjectMember.ROLE_ADMIN);

        assertEquals(ProjectMember.ROLE_ADMIN, result.getRole());
        verify(memberRepository).save(member);
    }

    @Test
    void updateMemberRole_WithInvalidRole_ShouldThrow() {
        assertThrows(IllegalArgumentException.class,
                () -> projectService.updateMemberRole(UUID.randomUUID().toString(), "user-1", "superadmin"));
    }

    @Test
    void updateMemberRole_WhenOwner_ShouldThrow() {
        var projectId = UUID.randomUUID().toString();
        var owner = new ProjectMember(projectId, "owner-1", "Owner", "o@e.com", ProjectMember.ROLE_OWNER);
        when(memberRepository.findByProjectIdAndUserId(projectId, "owner-1")).thenReturn(Optional.of(owner));

        assertThrows(IllegalStateException.class,
                () -> projectService.updateMemberRole(projectId, "owner-1", ProjectMember.ROLE_ADMIN));
    }

    @Test
    void updateMemberRole_WhenNotFound_ShouldThrow() {
        var projectId = UUID.randomUUID().toString();
        when(memberRepository.findByProjectIdAndUserId(projectId, "unknown")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> projectService.updateMemberRole(projectId, "unknown", ProjectMember.ROLE_MEMBER));
    }

    @Test
    void getMembers_ShouldReturnList() {
        var projectId = UUID.randomUUID().toString();
        var members = List.of(
                new ProjectMember(projectId, "u1", "U1", "u1@e.com", "owner"),
                new ProjectMember(projectId, "u2", "U2", "u2@e.com", "member")
        );
        when(memberRepository.findByProjectId(projectId)).thenReturn(members);

        var result = projectService.getMembers(projectId);

        assertEquals(2, result.size());
        verify(memberRepository).findByProjectId(projectId);
    }

    @Test
    void getUserProjects_ShouldReturnList() {
        when(memberRepository.findByUserId("user-1")).thenReturn(List.of());

        var result = projectService.getUserProjects("user-1");

        assertTrue(result.isEmpty());
        verify(memberRepository).findByUserId("user-1");
    }
}
