package com.cloudbuilder.environment.infrastructure.web;

import com.cloudbuilder.environment.application.dto.EnvironmentRequest;
import com.cloudbuilder.environment.application.dto.EnvironmentResponse;
import com.cloudbuilder.environment.application.dto.UpdateEnvironmentRequest;
import com.cloudbuilder.environment.domain.model.ManagedEnvironment;
import com.cloudbuilder.environment.domain.service.EnvironmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/environments")
@PreAuthorize("isAuthenticated()")
public class EnvironmentController {

    private final EnvironmentService environmentService;

    public EnvironmentController(EnvironmentService environmentService) {
        this.environmentService = environmentService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<EnvironmentResponse> create(@Valid @RequestBody EnvironmentRequest req) {
        var env = new ManagedEnvironment(
            req.tenantId(), req.name(), req.provider(),
            req.region(), req.credentialsId());
        env.setDescription(req.description());
        env.setConfigJson(req.configJson());
        var saved = environmentService.create(env);
        return ResponseEntity.status(HttpStatus.CREATED).body(EnvironmentResponse.from(saved));
    }

    @GetMapping
    public ResponseEntity<List<EnvironmentResponse>> list(@RequestParam String tenantId) {
        var environments = environmentService.findByTenantId(tenantId);
        var response = environments.stream().map(EnvironmentResponse::from).toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EnvironmentResponse> get(@PathVariable String id) {
        return environmentService.findById(id)
                .map(e -> ResponseEntity.ok(EnvironmentResponse.from(e)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<EnvironmentResponse> update(@PathVariable String id,
                                                       @Valid @RequestBody UpdateEnvironmentRequest req) {
        return environmentService.update(id, req.name(), req.description(), req.provider(),
                        req.region(), req.credentialsId(), req.configJson(), req.status())
                .map(e -> ResponseEntity.ok(EnvironmentResponse.from(e)))
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        environmentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
