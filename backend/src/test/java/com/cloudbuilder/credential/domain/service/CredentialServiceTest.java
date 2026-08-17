package com.cloudbuilder.credential.domain.service;

import com.cloudbuilder.credential.domain.model.Credential;
import com.cloudbuilder.credential.domain.port.CredentialRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CredentialServiceTest {

    @Mock
    private CredentialRepository credentialRepository;

    private CredentialService service;

    private Credential testCredential;

    @BeforeEach
    void setUp() {
        service = new CredentialService(credentialRepository);
        testCredential = new Credential("tenant-1", "GCP SA", "google", "service-account",
            "{\"type\":\"service_account\"}");
    }

    @Test
    void create_savesAndReturnsCredential() {
        when(credentialRepository.save(any())).thenReturn(testCredential);

        Credential result = service.create(testCredential);

        assertNotNull(result);
        assertEquals("GCP SA", result.getName());
        assertEquals("google", result.getProvider());
        verify(credentialRepository).save(testCredential);
    }

    @Test
    void findByTenantId_returnsCredentialsForTenant() {
        var cred2 = new Credential("tenant-1", "AWS Key", "aws", "access-key", "{}");
        when(credentialRepository.findByTenantId("tenant-1")).thenReturn(List.of(testCredential, cred2));

        List<Credential> result = service.findByTenantId("tenant-1");

        assertEquals(2, result.size());
        assertEquals("tenant-1", result.get(0).getTenantId());
    }

    @Test
    void findByTenantId_returnsEmptyWhenNoCredentials() {
        when(credentialRepository.findByTenantId("empty-tenant")).thenReturn(List.of());

        List<Credential> result = service.findByTenantId("empty-tenant");

        assertTrue(result.isEmpty());
    }

    @Test
    void findById_returnsCredentialWhenExists() {
        when(credentialRepository.findById("cred-1")).thenReturn(Optional.of(testCredential));

        Optional<Credential> result = service.findById("cred-1");

        assertTrue(result.isPresent());
        assertEquals("GCP SA", result.get().getName());
    }

    @Test
    void findById_returnsEmptyWhenNotFound() {
        when(credentialRepository.findById("nonexistent")).thenReturn(Optional.empty());

        Optional<Credential> result = service.findById("nonexistent");

        assertFalse(result.isPresent());
    }

    @Test
    void update_modifiesCredentialFields() {
        when(credentialRepository.findById("cred-1")).thenReturn(Optional.of(testCredential));
        when(credentialRepository.save(any())).thenReturn(testCredential);

        Optional<Credential> result = service.update("cred-1",
            "New Name", "aws", "access-key", "{\"key\":\"val\"}", true);

        assertTrue(result.isPresent());
        assertEquals("New Name", result.get().getName());
        assertEquals("aws", result.get().getProvider());
        assertEquals("access-key", result.get().getAuthType());
        assertTrue(result.get().isActive());
        verify(credentialRepository).save(any());
    }

    @Test
    void update_returnsEmptyWhenNotFound() {
        when(credentialRepository.findById("nonexistent")).thenReturn(Optional.empty());

        Optional<Credential> result = service.update("nonexistent",
            "name", "aws", "key", "{}", true);

        assertFalse(result.isPresent());
        verify(credentialRepository, never()).save(any());
    }

    @Test
    void delete_callsRepositoryDelete() {
        service.delete("cred-1");
        verify(credentialRepository).deleteById("cred-1");
    }

    @Test
    void testConnection_returnsTrueWhenCredentialExists() {
        when(credentialRepository.findById("cred-1")).thenReturn(Optional.of(testCredential));

        boolean result = service.testConnection("cred-1");

        assertTrue(result);
    }

    @Test
    void testConnection_returnsFalseWhenNotFound() {
        when(credentialRepository.findById("nonexistent")).thenReturn(Optional.empty());

        boolean result = service.testConnection("nonexistent");

        assertFalse(result);
    }
}
