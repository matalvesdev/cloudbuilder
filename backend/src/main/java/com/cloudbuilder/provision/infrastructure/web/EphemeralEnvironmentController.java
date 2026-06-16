package com.cloudbuilder.provision.infrastructure.web;

import com.cloudbuilder.provision.application.dto.CreateEphemeralRequest;
import com.cloudbuilder.provision.application.dto.ExtendTtlRequest;
import com.cloudbuilder.provision.domain.model.EphemeralEnvironment;
import com.cloudbuilder.provision.domain.service.EphemeralEnvironmentService;
import com.cloudbuilder.shared.security.TenantContext;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ephemeral")
@Validated
@PreAuthorize("isAuthenticated()")
public class EphemeralEnvironmentController {

    private final EphemeralEnvironmentService service;

    public EphemeralEnvironmentController(EphemeralEnvironmentService service) {
        this.service = service;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<EphemeralEnvironment> create(@Valid @RequestBody CreateEphemeralRequest req) {
        EphemeralEnvironment env = service.create(
                TenantContext.getTenantId(),
                req.name(), req.name(), req.repoId(), req.branchName(),
                req.sourceEnvironmentId(), req.ttlHours(), req.resourceSize());
        return ResponseEntity.status(HttpStatus.CREATED).body(env);
    }

    @GetMapping
    public ResponseEntity<List<EphemeralEnvironment>> list() {
        return ResponseEntity.ok(service.getByTenant(TenantContext.getTenantId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EphemeralEnvironment> get(@PathVariable UUID id) {
        return service.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/destroy")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<EphemeralEnvironment> destroy(@PathVariable UUID id) {
        return ResponseEntity.ok(service.destroy(id));
    }

    @PostMapping("/{id}/extend")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<EphemeralEnvironment> extendTtl(
            @PathVariable UUID id, @Valid @RequestBody ExtendTtlRequest req) {
        return ResponseEntity.ok(service.extendTtl(id, req.extraHours()));
    }

    @GetMapping("/active-count")
    public ResponseEntity<Long> getActiveCount() {
        return ResponseEntity.ok(service.getActiveCount(TenantContext.getTenantId()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
