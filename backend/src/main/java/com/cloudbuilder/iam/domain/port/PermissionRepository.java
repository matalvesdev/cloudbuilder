package com.cloudbuilder.iam.domain.port;

import com.cloudbuilder.iam.domain.model.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface PermissionRepository extends JpaRepository<Permission, String> {
    List<Permission> findByRoleId(String roleId);
    List<Permission> findByRoleIdIn(List<String> roleIds);
}
