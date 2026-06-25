package com.cloudbuilder.deployment.infrastructure.web;

import com.cloudbuilder.deployment.application.dto.DeploymentRequest;
import com.cloudbuilder.deployment.application.dto.DeploymentResponse;
import com.cloudbuilder.deployment.domain.model.Deployment;
import com.cloudbuilder.deployment.domain.service.DeploymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/deployments")
@PreAuthorize("isAuthenticated()")
public class DeploymentController {

    private final DeploymentService deploymentService;

    public DeploymentController(DeploymentService deploymentService) {
        this.deploymentService = deploymentService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<DeploymentResponse> create(@Valid @RequestBody DeploymentRequest req) {
        var deployment = new Deployment(
            req.tenantId(), req.environmentId(), req.canvasDesignId(),
            req.version(), req.deployedBy());
        var saved = deploymentService.create(deployment);
        return ResponseEntity.status(HttpStatus.CREATED).body(DeploymentResponse.from(saved));
    }

    @GetMapping
    public ResponseEntity<List<DeploymentResponse>> list(@RequestParam String environmentId) {
        var deployments = deploymentService.findByEnvironmentId(environmentId);
        var response = deployments.stream().map(DeploymentResponse::from).toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DeploymentResponse> get(@PathVariable String id) {
        return deploymentService.findById(id)
                .map(d -> ResponseEntity.ok(DeploymentResponse.from(d)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/rollback")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<DeploymentResponse> rollback(@PathVariable String id) {
        return deploymentService.rollback(id)
                .map(d -> ResponseEntity.ok(DeploymentResponse.from(d)))
                .orElse(ResponseEntity.notFound().build());
    }
}
