package com.cloudbuilder.credential.infrastructure.web;

import com.cloudbuilder.credential.application.dto.CredentialRequest;
import com.cloudbuilder.credential.application.dto.UpdateCredentialRequest;
import com.cloudbuilder.credential.domain.model.Credential;
import com.cloudbuilder.credential.domain.service.CredentialService;
import com.cloudbuilder.shared.security.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CredentialControllerTest {

    @Mock
    private CredentialService credentialService;

    @InjectMocks
    private CredentialController controller;

    private Credential testCredential;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId("tenant-1");
        testCredential = new Credential("tenant-1", "GCP SA", "google", "service-account",
            "{\"type\":\"service_account\"}");
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void create_returnsCreatedCredential() {
        when(credentialService.create(any())).thenReturn(testCredential);

        var req = new CredentialRequest("tenant-1", "GCP SA", "google", "service-account",
            "{\"type\":\"service_account\"}");

        var response = controller.create(req);

        assertEquals(201, response.getStatusCodeValue());
        assertNotNull(response.getBody());
        assertEquals("GCP SA", response.getBody().name());
        assertEquals("google", response.getBody().provider());
    }

    @Test
    void list_returnsCredentialsForTenant() {
        var cred2 = new Credential("tenant-1", "AWS Key", "aws", "access-key", "{}");
        when(credentialService.findByTenantId("tenant-1")).thenReturn(List.of(testCredential, cred2));

        var response = controller.list("tenant-1");

        assertEquals(200, response.getStatusCodeValue());
        assertEquals(2, response.getBody().size());
    }

    @Test
    void list_returnsEmptyListWhenNoCredentials() {
        when(credentialService.findByTenantId("empty-tenant")).thenReturn(List.of());

        var response = controller.list("empty-tenant");

        assertEquals(200, response.getStatusCodeValue());
        assertTrue(response.getBody().isEmpty());
    }

    @Test
    void get_returnsCredentialWhenExists() {
        when(credentialService.findById("cred-1")).thenReturn(Optional.of(testCredential));

        var response = controller.get("cred-1");

        assertEquals(200, response.getStatusCodeValue());
        assertEquals("GCP SA", response.getBody().name());
    }

    @Test
    void get_returns404WhenNotFound() {
        when(credentialService.findById("nonexistent")).thenReturn(Optional.empty());

        var response = controller.get("nonexistent");

        assertEquals(404, response.getStatusCodeValue());
    }

    @Test
    void update_modifiesAndReturnsCredential() {
        when(credentialService.update(eq("cred-1"), anyString(), anyString(), anyString(), anyString(), anyBoolean()))
            .thenReturn(Optional.of(testCredential));

        var req = new UpdateCredentialRequest("New Name", "aws", "access-key", "{}", true);

        var response = controller.update("cred-1", req);

        assertEquals(200, response.getStatusCodeValue());
        assertNotNull(response.getBody());
    }

    @Test
    void update_returns404WhenNotFound() {
        when(credentialService.update(eq("nonexistent"), anyString(), anyString(), anyString(), anyString(), anyBoolean()))
            .thenReturn(Optional.empty());

        var req = new UpdateCredentialRequest("name", "aws", "key", "{}", true);

        var response = controller.update("nonexistent", req);

        assertEquals(404, response.getStatusCodeValue());
    }

    @Test
    void delete_returns204() {
        doNothing().when(credentialService).delete("cred-1");

        var response = controller.delete("cred-1");

        assertEquals(204, response.getStatusCodeValue());
        verify(credentialService).delete("cred-1");
    }

    @Test
    void testConnection_returns200WhenExists() {
        when(credentialService.testConnection("cred-1")).thenReturn(true);

        var response = controller.testConnection("cred-1");

        assertEquals(200, response.getStatusCodeValue());
        assertTrue(response.getBody().success());
    }

    @Test
    void testConnection_returns404WhenNotFound() {
        when(credentialService.testConnection("nonexistent")).thenReturn(false);

        var response = controller.testConnection("nonexistent");

        assertEquals(404, response.getStatusCodeValue());
        assertFalse(response.getBody().success());
    }
}
