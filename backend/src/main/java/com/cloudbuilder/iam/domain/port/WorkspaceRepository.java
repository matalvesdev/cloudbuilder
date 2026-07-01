package com.cloudbuilder.iam.domain.port;

import com.cloudbuilder.iam.domain.model.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkspaceRepository extends JpaRepository<Workspace, String> {
    List<Workspace> findByOrganizationId(String organizationId);
    List<Workspace> findByOrganizationIdAndActive(String organizationId, boolean active);
}
