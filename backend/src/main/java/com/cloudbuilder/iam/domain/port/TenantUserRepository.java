package com.cloudbuilder.iam.domain.port;

import com.cloudbuilder.iam.domain.model.TenantUser;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface TenantUserRepository extends JpaRepository<TenantUser, String> {
    List<TenantUser> findByTenantId(String tenantId);
    Optional<TenantUser> findByTenantIdAndUserId(String tenantId, String userId);
    List<TenantUser> findByUserId(String userId);
}
