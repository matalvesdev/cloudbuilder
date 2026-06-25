package com.cloudbuilder.credential.infrastructure.web;

import com.cloudbuilder.credential.application.dto.CredentialRequest;
import com.cloudbuilder.credential.application.dto.CredentialResponse;
import com.cloudbuilder.credential.application.dto.TestConnectionResponse;
import com.cloudbuilder.credential.application.dto.UpdateCredentialRequest;
import com.cloudbuilder.credential.domain.model.Credential;
import com.cloudbuilder.credential.domain.service.CredentialService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/credentials")
@PreAuthorize("isAuthenticated()")
public class CredentialController {

    private final CredentialService credentialService;

    public CredentialController(CredentialService credentialService) {
        this.credentialService = credentialService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<CredentialResponse> create(@Valid @RequestBody CredentialRequest req) {
        var credential = new Credential(
            req.tenantId(), req.name(), req.provider(),
            req.authType(), req.encryptedPayload());
        var saved = credentialService.create(credential);
        return ResponseEntity.status(HttpStatus.CREATED).body(CredentialResponse.from(saved));
    }

    @GetMapping
    public ResponseEntity<List<CredentialResponse>> list(@RequestParam String tenantId) {
        var credentials = credentialService.findByTenantId(tenantId);
        var response = credentials.stream().map(CredentialResponse::from).toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CredentialResponse> get(@PathVariable String id) {
        return credentialService.findById(id)
                .map(c -> ResponseEntity.ok(CredentialResponse.from(c)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<CredentialResponse> update(@PathVariable String id,
                                                     @Valid @RequestBody UpdateCredentialRequest req) {
        return credentialService.update(id, req.name(), req.provider(), req.authType(),
                        req.encryptedPayload(), req.isActive())
                .map(c -> ResponseEntity.ok(CredentialResponse.from(c)))
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        credentialService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/test")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<TestConnectionResponse> testConnection(@PathVariable String id) {
        var exists = credentialService.testConnection(id);
        if (exists) {
            return ResponseEntity.ok(new TestConnectionResponse(true, "Connection successful"));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new TestConnectionResponse(false, "Credential not found"));
    }
}
