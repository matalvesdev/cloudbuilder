package com.cloudbuilder.iam.domain.port;

import com.cloudbuilder.iam.domain.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface RoleRepository extends JpaRepository<Role, String> {
    List<Role> findByTenantId(String tenantId);
    Optional<Role> findByTenantIdAndName(String tenantId, String name);
}
