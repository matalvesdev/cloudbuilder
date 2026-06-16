package com.cloudbuilder.iam.domain.port;

import com.cloudbuilder.iam.domain.model.TenantUser;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TenantUserRepository extends JpaRepository<TenantUser, UUID> {
    List<TenantUser> findByTenantId(UUID tenantId);
    Optional<TenantUser> findByTenantIdAndUserId(UUID tenantId, UUID userId);
    List<TenantUser> findByUserId(UUID userId);
}
