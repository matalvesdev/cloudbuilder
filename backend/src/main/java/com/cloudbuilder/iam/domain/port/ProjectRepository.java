package com.cloudbuilder.iam.domain.port;

import com.cloudbuilder.iam.domain.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, String> {

    List<Project> findByOrganizationId(String organizationId);

    List<Project> findByOrganizationIdAndActiveTrue(String organizationId);

    List<Project> findByOrganizationIdAndNameContainingIgnoreCase(String organizationId, String name);
}
