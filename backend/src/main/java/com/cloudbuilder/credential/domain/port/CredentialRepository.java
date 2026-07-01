package com.cloudbuilder.credential.domain.port;

import com.cloudbuilder.credential.domain.model.Credential;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CredentialRepository extends JpaRepository<Credential, String> {
    List<Credential> findByTenantId(String tenantId);
    List<Credential> findByProvider(String provider);
    List<Credential> findByTenantIdAndProvider(String tenantId, String provider);
    List<Credential> findByOrganizationId(String organizationId);
}
