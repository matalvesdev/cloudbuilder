package com.cloudbuilder.iam.domain.port;

import com.cloudbuilder.iam.domain.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, String> {

    List<Project> findByOrganizationId(String organizationId);

    List<Project> findByOrganizationIdAndActiveTrue(String organizationId);

    List<Project> findByNameContainingIgnoreCase(String organizationId, String name);
}
