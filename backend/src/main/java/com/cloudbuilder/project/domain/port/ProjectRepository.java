package com.cloudbuilder.project.domain.port;

import com.cloudbuilder.project.domain.model.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, String> {

    Page<Project> findByTenantIdAndStatusOrderByCreatedAtDesc(
        String tenantId, Project.ProjectStatus status, Pageable pageable);

    Optional<Project> findByTenantIdAndSlug(String tenantId, String slug);

    long countByTenantIdAndStatus(String tenantId, Project.ProjectStatus status);
}
