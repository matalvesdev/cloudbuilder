package com.cloudbuilder.git.infrastructure.web;

import com.cloudbuilder.git.application.dto.ConnectRepoRequest;
import com.cloudbuilder.git.application.dto.PipelineResponse;
import com.cloudbuilder.git.application.dto.PipelineRunDTO;
import com.cloudbuilder.git.application.dto.RepoScanResponse;
import com.cloudbuilder.git.domain.model.AppDetection;
import com.cloudbuilder.git.domain.model.ConnectedRepository;
import com.cloudbuilder.git.domain.model.PipelineRun;
import com.cloudbuilder.git.domain.model.RepositoryScan;
import com.cloudbuilder.git.domain.model.WebhookEvent;
import com.cloudbuilder.git.domain.port.ConnectedRepositoryPort;
import com.cloudbuilder.git.domain.port.PipelineRunPort;
import com.cloudbuilder.git.domain.port.RepositoryScanPort;
import com.cloudbuilder.git.domain.service.GitScannerService;
import com.cloudbuilder.git.domain.service.IaCDetector;
import com.cloudbuilder.git.domain.service.PipelineGeneratorService;
import com.cloudbuilder.git.domain.service.WebhookService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/git")
@PreAuthorize("isAuthenticated()")
public class GitController {

    @Value("${cloudbuilder.git.webhook-secret:}")
    private String webhookSecret;

    private final ConnectedRepositoryPort repositoryPort;
    private final RepositoryScanPort scanPort;
    private final GitScannerService scannerService;
    private final IaCDetector iacDetector;
    private final PipelineGeneratorService pipelineGenerator;
    private final WebhookService webhookService;
    private final PipelineRunPort pipelineRunPort;

    public GitController(ConnectedRepositoryPort repositoryPort,
                         RepositoryScanPort scanPort,
                         GitScannerService scannerService,
                         IaCDetector iacDetector,
                         PipelineGeneratorService pipelineGenerator,
                         WebhookService webhookService,
                         PipelineRunPort pipelineRunPort) {
        this.repositoryPort = repositoryPort;
        this.scanPort = scanPort;
        this.scannerService = scannerService;
        this.iacDetector = iacDetector;
        this.pipelineGenerator = pipelineGenerator;
        this.webhookService = webhookService;
        this.pipelineRunPort = pipelineRunPort;
    }

    @PostMapping("/connect")
    public ResponseEntity<ConnectedRepository> connectRepository(@RequestBody ConnectRepoRequest request) {
        ConnectedRepository.Provider provider;
        try {
            provider = ConnectedRepository.Provider.valueOf(request.getProvider().toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }

        String repoUrl = request.getRepoUrl();
        String fullName = extractFullName(repoUrl);
        String[] parts = fullName.split("/");
        String owner = parts.length > 1 ? parts[0] : "";
        String repoName = parts.length > 1 ? parts[1] : fullName;
        String defaultBranch = "main";

        ConnectedRepository repo = new ConnectedRepository(
                provider, repoUrl, repoName, fullName,
                owner, defaultBranch, request.getToken()
        );

        ConnectedRepository saved = repositoryPort.save(repo);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/repositories")
    public ResponseEntity<List<ConnectedRepository>> listRepositories() {
        return ResponseEntity.ok(repositoryPort.findAll());
    }

    @DeleteMapping("/repositories/{id}")
    public ResponseEntity<Void> disconnectRepository(@PathVariable String id) {
        ConnectedRepository repo = repositoryPort.findById(id)
                .orElse(null);
        if (repo == null) {
            return ResponseEntity.notFound().build();
        }
        repo.setStatus(ConnectedRepository.Status.DISCONNECTED);
        repositoryPort.save(repo);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/repositories/{id}/scan")
    public ResponseEntity<RepoScanResponse> scanRepository(@PathVariable String id) {
        try {
            RepositoryScan scan = scannerService.scanRepository(id);
            List<String> files = scannerService.getDetectedFiles(id);

            RepoScanResponse response = new RepoScanResponse(
                    id, files, scan.getResourceCount(), scan.getAppDetection()
            );
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/repositories/{id}/files")
    public ResponseEntity<List<String>> getDetectedFiles(@PathVariable String id) {
        try {
            List<String> files = scannerService.getDetectedFiles(id);
            return ResponseEntity.ok(files);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/repositories/{id}/pipeline")
    public ResponseEntity<PipelineResponse> generatePipeline(
            @PathVariable String id,
            @RequestParam(name = "engine", defaultValue = "github-actions") String engine) {

        RepositoryScan scan = scanPort.findByRepositoryId(id).stream()
                .filter(s -> s.getStatus() == RepositoryScan.Status.COMPLETED)
                .findFirst()
                .orElse(null);

        if (scan == null || scan.getAppDetection() == null) {
            return ResponseEntity.badRequest().build();
        }

        AppDetection detection = scan.getAppDetection();
        String yaml;
        String filename;
        String description;

        switch (engine.toLowerCase()) {
            case "github-actions" -> {
                yaml = pipelineGenerator.generateGithubActions(detection);
                filename = ".github/workflows/deploy.yml";
                description = "GitHub Actions workflow gerado para " + detection.getAppType();
            }
            case "gitlab-ci" -> {
                yaml = pipelineGenerator.generateGitlabCi(detection);
                filename = ".gitlab-ci.yml";
                description = "GitLab CI pipeline gerado para " + detection.getAppType();
            }
            default -> {
                return ResponseEntity.badRequest().build();
            }
        }

        PipelineResponse response = new PipelineResponse(yaml, filename, description);
        return ResponseEntity.ok(response);
    }

    // ── Webhook endpoints ──────────────────────────────────────────────

    @PostMapping("/webhooks")
    public ResponseEntity<WebhookEvent> receiveWebhook(
            @RequestHeader("X-GitHub-Event") String eventType,
            @RequestHeader("X-Hub-Signature-256") String signature,
            @RequestHeader("X-GitHub-Delivery") String deliveryId,
            @RequestBody String payload,
            @RequestParam String repositoryId,
            @RequestParam(required = false) String branch,
            @RequestParam(required = false) String commitSha,
            @RequestParam(required = false) String actor) {
        var event = webhookService.receiveEvent(
                eventType, repositoryId, payload, signature,
                webhookSecret, deliveryId, branch, commitSha, actor
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(event);
    }

    @GetMapping("/webhooks/{id}")
    public ResponseEntity<WebhookEvent> getWebhookEvent(@PathVariable String id) {
        return webhookService.getEvent(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/webhooks/repository/{repositoryId}")
    public ResponseEntity<List<WebhookEvent>> getWebhookEventsByRepository(
            @PathVariable String repositoryId) {
        return ResponseEntity.ok(webhookService.getEventsByRepository(repositoryId));
    }

    @GetMapping("/webhooks/status/{status}")
    public ResponseEntity<List<WebhookEvent>> getWebhookEventsByStatus(
            @PathVariable String status) {
        try {
            WebhookEvent.Status eventStatus = WebhookEvent.Status.valueOf(status.toUpperCase());
            return ResponseEntity.ok(webhookService.getEventsByStatus(eventStatus));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/webhooks/repository/{repositoryId}/stats")
    public ResponseEntity<Map<String, Object>> getWebhookStats(
            @PathVariable String repositoryId) {
        List<WebhookEvent> events = webhookService.getEventsByRepository(repositoryId);
        long total = events.size();
        long successful = events.stream()
                .filter(e -> e.getStatus() == WebhookEvent.Status.PROCESSED)
                .count();
        long failed = events.stream()
                .filter(e -> e.getStatus() == WebhookEvent.Status.FAILED
                        || e.getStatus() == WebhookEvent.Status.VERIFICATION_FAILED)
                .count();
        long pending = events.stream()
                .filter(e -> e.getStatus() == WebhookEvent.Status.RECEIVED
                        || e.getStatus() == WebhookEvent.Status.VERIFIED)
                .count();

        return ResponseEntity.ok(Map.of(
                "repositoryId", repositoryId,
                "total", total,
                "successful", successful,
                "failed", failed,
                "pending", pending,
                "successRate", total > 0 ? (double) successful / total * 100 : 0.0
        ));
    }

    @PostMapping("/webhooks/{id}/retry")
    public ResponseEntity<Map<String, Object>> retryWebhook(@PathVariable String id) {
        try {
            Map<String, Object> result = webhookService.retryEvent(id);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── Pipeline visualization endpoints ──────────────────────────────

    @GetMapping("/pipelines/{repoId}")
    public ResponseEntity<List<PipelineRunDTO>> getPipelineRuns(@PathVariable String repoId) {
        var runs = pipelineRunPort.findByRepositoryIdOrderByCreatedAtDesc(repoId).stream()
                .map(PipelineRunDTO::from)
                .toList();
        return ResponseEntity.ok(runs);
    }

    @PostMapping("/pipelines")
    public ResponseEntity<PipelineRun> createPipelineRun(@RequestBody PipelineRun run) {
        // Allow status override for incoming runs
        if (run.getStatus() == null) {
            run.setStatus(PipelineRun.Status.PENDING);
        }
        PipelineRun saved = pipelineRunPort.save(run);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    private String extractFullName(String repoUrl) {
        if (repoUrl.contains("github.com/")) {
            String path = repoUrl.substring(repoUrl.indexOf("github.com/") + "github.com/".length());
            if (path.endsWith(".git")) {
                path = path.substring(0, path.length() - 4);
            }
            return path;
        }
        if (repoUrl.contains("gitlab.com/")) {
            String path = repoUrl.substring(repoUrl.indexOf("gitlab.com/") + "gitlab.com/".length());
            if (path.endsWith(".git")) {
                path = path.substring(0, path.length() - 4);
            }
            return path;
        }
        if (repoUrl.contains("bitbucket.org/")) {
            String path = repoUrl.substring(repoUrl.indexOf("bitbucket.org/") + "bitbucket.org/".length());
            if (path.endsWith(".git")) {
                path = path.substring(0, path.length() - 4);
            }
            return path;
        }
        return repoUrl;
    }
}
