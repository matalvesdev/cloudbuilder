package com.cloudbuilder.iam.domain.port;

import com.cloudbuilder.iam.domain.model.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface PermissionRepository extends JpaRepository<Permission, UUID> {
    List<Permission> findByRoleId(UUID roleId);
    List<Permission> findByRoleIdIn(List<UUID> roleIds);
}
