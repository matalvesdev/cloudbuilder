package com.cloudbuilder.design.infrastructure.web;

import com.cloudbuilder.design.domain.model.ComponentDefinition;
import com.cloudbuilder.design.domain.service.ComponentDefinitionService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/component-definitions")
@Validated
public class ComponentDefinitionController {

    private final ComponentDefinitionService service;

    public ComponentDefinitionController(ComponentDefinitionService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ComponentDefinition>> list(
            @RequestParam(required = false) String provider,
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(service.listDefinitions(provider, category));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ComponentDefinition> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getDefinition(id));
    }

    @GetMapping("/by-type/{resourceType}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ComponentDefinition> getByResourceType(@PathVariable String resourceType) {
        return ResponseEntity.ok(service.getDefinitionByResourceType(resourceType));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ComponentDefinition> create(@Valid @RequestBody CreateComponentDefinitionRequest request) {
        ComponentDefinition definition = new ComponentDefinition(
                request.provider(),
                request.resourceType(),
                request.category(),
                request.displayName(),
                request.description(),
                request.iconUrl(),
                request.propertiesSchema(),
                request.terraformTemplate(),
                request.validationRules(),
                request.costModel(),
                request.tags(),
                true);
        ComponentDefinition saved = service.createDefinition(definition);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.deleteDefinition(id);
        return ResponseEntity.noContent().build();
    }

    public record CreateComponentDefinitionRequest(
            @NotBlank String provider,
            @NotBlank String resourceType,
            @NotBlank String category,
            @NotBlank String displayName,
            String description,
            String iconUrl,
            String propertiesSchema,
            String terraformTemplate,
            String validationRules,
            String costModel,
            String tags) {}
}
