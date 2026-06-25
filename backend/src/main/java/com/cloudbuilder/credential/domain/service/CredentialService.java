package com.cloudbuilder.credential.domain.service;

import com.cloudbuilder.credential.domain.model.Credential;
import com.cloudbuilder.credential.domain.port.CredentialRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CredentialService {

    private final CredentialRepository credentialRepository;

    public CredentialService(CredentialRepository credentialRepository) {
        this.credentialRepository = credentialRepository;
    }

    public Credential create(Credential credential) {
        return credentialRepository.save(credential);
    }

    @Transactional(readOnly = true)
    public List<Credential> findByTenantId(String tenantId) {
        return credentialRepository.findByTenantId(tenantId);
    }

    @Transactional(readOnly = true)
    public Optional<Credential> findById(String id) {
        return credentialRepository.findById(id);
    }

    public Optional<Credential> update(String id, String name, String provider, String authType, String encryptedPayload, boolean isActive) {
        return credentialRepository.findById(id).map(credential -> {
            credential.setName(name);
            credential.setProvider(provider);
            credential.setAuthType(authType);
            credential.setEncryptedPayload(encryptedPayload);
            credential.setActive(isActive);
            credential.setUpdatedAt(Instant.now());
            return credentialRepository.save(credential);
        });
    }

    public void delete(String id) {
        credentialRepository.deleteById(id);
    }

    public boolean testConnection(String id) {
        return credentialRepository.findById(id).isPresent();
    }
}
