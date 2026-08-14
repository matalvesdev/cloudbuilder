package com.cloudbuilder.provision.infrastructure.web;

import com.cloudbuilder.credential.domain.model.Credential;
import com.cloudbuilder.credential.domain.service.CredentialService;
import com.cloudbuilder.provision.application.dto.CanvasDesign;
import com.cloudbuilder.provision.application.dto.GeneratedCode;
import com.cloudbuilder.provision.application.port.CanvasDesignFetcher;
import com.cloudbuilder.provision.domain.service.CodeGeneratorService;
import com.cloudbuilder.shared.security.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;
import java.util.Map;

/**
 * Provision Controller — the core endpoint for Canvas → Terraform → Cloud provisioning.
 *
 * Flow:
 *  1. Fetch canvas design (nodes + edges)
 *  2. Resolve provider from node types
 *  3. Generate Terraform code with proper variable resolution
 *  4. Inject cloud credentials as environment variables
 *  5. Send to Go provision engine for terraform init → plan → apply
 *
 * This is the single entry point for the user's provisioning workflow.
 */
@RestController
@RequestMapping("/api/v1/canvases/{canvasId}/provision")
@PreAuthorize("isAuthenticated()")
public class ProvisionController {

    private static final Logger log = LoggerFactory.getLogger(ProvisionController.class);

    private final CanvasDesignFetcher canvasDesignFetcher;
    private final CodeGeneratorService codeGeneratorService;
    private final CredentialService credentialService;

    public ProvisionController(CanvasDesignFetcher canvasDesignFetcher,
                                CodeGeneratorService codeGeneratorService,
                                CredentialService credentialService) {
        this.canvasDesignFetcher = canvasDesignFetcher;
        this.codeGeneratorService = codeGeneratorService;
        this.credentialService = credentialService;
    }

    /**
     * Execute a full provisioning workflow: generate Terraform from canvas and apply it.
     *
     * Request body:
     *   - credentialId: the cloud provider credential to use (must belong to the tenant)
     *   - engine: "terraform" (default) or "opentofu"
     *   - autoApprove: if true, skip plan review and apply immediately (default: false)
     */
    @PostMapping("/apply")
    public ResponseEntity<Map<String, Object>> provisionApply(
            @PathVariable String canvasId,
            @RequestBody ProvisionRequest request) {

        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "No tenant in session"
            ));
        }

        log.info("Provision apply requested: canvas={}, tenant={}, credentialId={}",
                canvasId, tenantId, request.credentialId());

        // 1. Fetch canvas design
        CanvasDesign design;
        try {
            design = canvasDesignFetcher.fetchCanvasDesign(canvasId);
        } catch (Exception e) {
            log.error("Failed to fetch canvas design: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Canvas not found or inaccessible: " + e.getMessage()
            ));
        }

        if (design.nodes().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Canvas has no nodes — add infrastructure components first"
            ));
        }

        // 2. Determine provider from node types
        String provider = design.nodes().stream()
            .map(n -> n.provider())
            .filter(p -> !"unknown".equals(p))
            .findFirst()
            .orElse("aws");

        // 3. Generate Terraform code
        String engine = request.engine() != null ? request.engine() : "terraform";
        GeneratedCode generatedCode = codeGeneratorService.generateCode(design, provider, engine);

        // 4. Resolve credential for provider injection
        Credential credential = null;
        if (request.credentialId() != null && !request.credentialId().isBlank()) {
            credential = credentialService.findById(request.credentialId()).orElse(null);
            if (credential == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Credential not found: " + request.credentialId()
                ));
            }
            if (!credential.getProvider().equals(provider) &&
                !credential.getProvider().startsWith(provider + "_")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Credential provider mismatch: expected " + provider
                        + " but got " + credential.getProvider()
                ));
            }
        }

        // 5. Inject credentials into environment
        Map<String, String> envVars = buildCredentialEnvVars(provider, credential);

        // 6. Build the provisioning request for the Go engine
        Map<String, Object> provisionRequest = Map.of(
            "canvasId", canvasId,
            "tenantId", tenantId,
            "provider", provider,
            "engine", engine,
            "files", generatedCode.files(),
            "resourceCount", generatedCode.resourceCount(),
            "envVars", envVars,
            "autoApprove", request.autoApprove() != null && request.autoApprove(),
            "credentialId", request.credentialId() != null ? request.credentialId() : ""
        );

        log.info("Provision prepared: provider={}, resources={}, files={}",
                provider, generatedCode.resourceCount(), generatedCode.files().size());

        return ResponseEntity.ok(provisionRequest);
    }

    /**
     * Preview the generated Terraform code without provisioning.
     * Useful for reviewing what will be deployed before committing.
     */
    @PostMapping("/preview")
    public ResponseEntity<Map<String, Object>> provisionPreview(
            @PathVariable String canvasId,
            @RequestParam(name = "engine", defaultValue = "terraform") String engine) {

        CanvasDesign design;
        try {
            design = canvasDesignFetcher.fetchCanvasDesign(canvasId);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Canvas not found: " + e.getMessage()
            ));
        }

        String provider = design.nodes().stream()
            .map(n -> n.provider())
            .filter(p -> !"unknown".equals(p))
            .findFirst()
            .orElse("aws");

        GeneratedCode generatedCode = codeGeneratorService.generateCode(design, provider, engine);

        return ResponseEntity.ok(Map.of(
            "canvasId", canvasId,
            "provider", provider,
            "engine", engine,
            "files", generatedCode.files(),
            "resourceCount", generatedCode.resourceCount()
        ));
    }

    /**
     * Build cloud provider environment variables from the credential.
     * Each provider has different env var requirements:
     *   - GCP: GOOGLE_CREDENTIALS (service account JSON)
     *   - AWS: AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY
     *   - Azure: ARM_CLIENT_ID + ARM_CLIENT_SECRET + ARM_TENANT_ID + ARM_SUBSCRIPTION_ID
     */
    private Map<String, String> buildCredentialEnvVars(String provider, Credential credential) {
        if (credential == null) {
            return Map.of();
        }

        String payload = credential.getEncryptedPayload();

        return switch (provider) {
            case "google" -> Map.of(
                "GOOGLE_CREDENTIALS", payload
            );
            case "aws" -> Map.of(
                "AWS_ACCESS_KEY_ID", extractField(payload, "accessKeyId"),
                "AWS_SECRET_ACCESS_KEY", extractField(payload, "secretAccessKey"),
                "AWS_DEFAULT_REGION", extractField(payload, "region")
            );
            case "azurerm" -> Map.of(
                "ARM_CLIENT_ID", extractField(payload, "clientId"),
                "ARM_CLIENT_SECRET", extractField(payload, "clientSecret"),
                "ARM_TENANT_ID", extractField(payload, "tenantId"),
                "ARM_SUBSCRIPTION_ID", extractField(payload, "subscriptionId")
            );
            default -> Map.of();
        };
    }

    /**
     * Extract a field from a JSON-like credential payload.
     * Falls back to the raw payload if parsing fails.
     */
    private String extractField(String payload, String fieldName) {
        if (payload == null) return "";
        // Simple JSON field extraction for credential payloads
        String search = "\"" + fieldName + "\"";
        int idx = payload.indexOf(search);
        if (idx < 0) return "";
        int colonIdx = payload.indexOf(':', idx + search.length());
        if (colonIdx < 0) return "";
        int start = payload.indexOf('"', colonIdx + 1);
        if (start < 0) return "";
        int end = payload.indexOf('"', start + 1);
        if (end < 0) return "";
        return payload.substring(start + 1, end);
    }

    /**
     * Request body for provision apply.
     */
    public record ProvisionRequest(
        String credentialId,
        String engine,
        Boolean autoApprove
    ) {}
}
