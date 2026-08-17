package com.cloudbuilder.project.domain.service;

import com.cloudbuilder.project.domain.model.Project;
import com.cloudbuilder.project.domain.port.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectWorkspaceServiceTest {

    @Mock
    private ProjectRepository projectRepo;

    private ProjectWorkspaceService service;

    private Project testProject;

    @BeforeEach
    void setUp() {
        service = new ProjectWorkspaceService(projectRepo);
        testProject = new Project("tenant-1", "My Project", "A test project", "my-project");
    }

    @Test
    void createProject_savesAndReturnsProject() {
        when(projectRepo.findByTenantIdAndSlug("tenant-1", "my-project")).thenReturn(Optional.empty());
        when(projectRepo.countByTenantIdAndStatus("tenant-1", Project.ProjectStatus.ACTIVE)).thenReturn(0L);
        when(projectRepo.save(any())).thenReturn(testProject);

        Project result = service.createProject("tenant-1", "My Project", "A test project", "my-project");

        assertNotNull(result);
        assertEquals("My Project", result.getName());
        assertEquals("my-project", result.getSlug());
    }

    @Test
    void createProject_throwsOnDuplicateSlug() {
        when(projectRepo.findByTenantIdAndSlug("tenant-1", "my-project")).thenReturn(Optional.of(testProject));

        assertThrows(RuntimeException.class, () ->
            service.createProject("tenant-1", "My Project", "Desc", "my-project"));
    }

    @Test
    void createProject_throwsOnTenantLimit() {
        when(projectRepo.findByTenantIdAndSlug("tenant-1", "new-proj")).thenReturn(Optional.empty());
        when(projectRepo.countByTenantIdAndStatus("tenant-1", Project.ProjectStatus.ACTIVE)).thenReturn(100L);

        assertThrows(RuntimeException.class, () ->
            service.createProject("tenant-1", "New Proj", "Desc", "new-proj"));
    }

    @Test
    void listProjects_returnsPageOfProjects() {
        Page<Project> page = new PageImpl<>(List.of(testProject));
        when(projectRepo.findByTenantIdAndStatusOrderByCreatedAtDesc(
            eq("tenant-1"), eq(Project.ProjectStatus.ACTIVE), any())).thenReturn(page);

        Page<Project> result = service.listProjects("tenant-1", PageRequest.of(0, 20));

        assertEquals(1, result.getContent().size());
    }

    @Test
    void getProject_returnsProjectWhenExists() {
        when(projectRepo.findById("proj-1")).thenReturn(Optional.of(testProject));

        Project result = service.getProject("proj-1");

        assertNotNull(result);
        assertEquals("My Project", result.getName());
    }

    @Test
    void getProject_throwsWhenNotFound() {
        when(projectRepo.findById("nonexistent")).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> service.getProject("nonexistent"));
    }

    @Test
    void archiveProject_archivesAndReturns() {
        when(projectRepo.findById("proj-1")).thenReturn(Optional.of(testProject));
        when(projectRepo.save(any())).thenReturn(testProject);

        Project result = service.archiveProject("proj-1");

        assertNotNull(result);
        verify(projectRepo).save(testProject);
    }

    @Test
    void activateProject_activatesAndReturns() {
        when(projectRepo.findById("proj-1")).thenReturn(Optional.of(testProject));
        when(projectRepo.save(any())).thenReturn(testProject);

        Project result = service.activateProject("proj-1");

        assertNotNull(result);
        verify(projectRepo).save(testProject);
    }
}
