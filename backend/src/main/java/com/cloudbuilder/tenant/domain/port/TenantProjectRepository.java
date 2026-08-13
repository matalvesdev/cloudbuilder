package com.cloudbuilder.tenant.domain.port;

import com.cloudbuilder.tenant.domain.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface TenantProjectRepository extends JpaRepository<Project, String> {

    List<Project> findByTenantId(String tenantId);

    List<Project> findByTenantIdAndIsActiveTrue(String tenantId);
}
