package com.cloudbuilder.provision.infrastructure.web;

import com.cloudbuilder.provision.domain.service.DiscoveryEngineService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/discovery")
@PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
public class DiscoveryEngineController {

    private final DiscoveryEngineService discoveryEngineService;

    public DiscoveryEngineController(DiscoveryEngineService discoveryEngineService) {
        this.discoveryEngineService = discoveryEngineService;
    }

    @PostMapping("/resources/{provider}")
    public ResponseEntity<List<DiscoveryEngineService.DiscoveredResource>> discoverResources(
            @PathVariable String provider,
            @RequestBody Map<String, String> credentials) {
        List<DiscoveryEngineService.DiscoveredResource> resources =
                discoveryEngineService.discoverResources(provider, credentials);
        return ResponseEntity.ok(resources);
    }

    @PostMapping("/validate/{provider}")
    public ResponseEntity<DiscoveryEngineService.ValidationResult> validateCredentials(
            @PathVariable String provider,
            @RequestBody Map<String, String> credentials) {
        DiscoveryEngineService.ValidationResult result =
                discoveryEngineService.validateCredentials(provider, credentials);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/providers")
    public ResponseEntity<List<String>> listProviders() {
        return ResponseEntity.ok(discoveryEngineService.discoverAll(Map.of()).keySet().stream().toList());
    }
}
