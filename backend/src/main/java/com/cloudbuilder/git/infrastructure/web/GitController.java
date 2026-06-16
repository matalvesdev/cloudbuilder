package com.cloudbuilder.git.infrastructure.web;

import com.cloudbuilder.git.application.dto.ConnectRepoRequest;
import com.cloudbuilder.git.application.dto.PipelineResponse;
import com.cloudbuilder.git.application.dto.RepoScanResponse;
import com.cloudbuilder.git.domain.model.AppDetection;
import com.cloudbuilder.git.domain.model.ConnectedRepository;
import com.cloudbuilder.git.domain.model.RepositoryScan;
import com.cloudbuilder.git.domain.port.ConnectedRepositoryPort;
import com.cloudbuilder.git.domain.port.RepositoryScanPort;
import com.cloudbuilder.git.domain.service.GitScannerService;
import com.cloudbuilder.git.domain.service.IaCDetector;
import com.cloudbuilder.git.domain.service.PipelineGeneratorService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/git")
@PreAuthorize("isAuthenticated()")
public class GitController {

    private final ConnectedRepositoryPort repositoryPort;
    private final RepositoryScanPort scanPort;
    private final GitScannerService scannerService;
    private final IaCDetector iacDetector;
    private final PipelineGeneratorService pipelineGenerator;

    public GitController(ConnectedRepositoryPort repositoryPort,
                         RepositoryScanPort scanPort,
                         GitScannerService scannerService,
                         IaCDetector iacDetector,
                         PipelineGeneratorService pipelineGenerator) {
        this.repositoryPort = repositoryPort;
        this.scanPort = scanPort;
        this.scannerService = scannerService;
        this.iacDetector = iacDetector;
        this.pipelineGenerator = pipelineGenerator;
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
    public ResponseEntity<Void> disconnectRepository(@PathVariable UUID id) {
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
    public ResponseEntity<RepoScanResponse> scanRepository(@PathVariable UUID id) {
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
    public ResponseEntity<List<String>> getDetectedFiles(@PathVariable UUID id) {
        try {
            List<String> files = scannerService.getDetectedFiles(id);
            return ResponseEntity.ok(files);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/repositories/{id}/pipeline")
    public ResponseEntity<PipelineResponse> generatePipeline(
            @PathVariable UUID id,
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
