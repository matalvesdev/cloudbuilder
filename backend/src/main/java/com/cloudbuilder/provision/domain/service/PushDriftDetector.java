package com.cloudbuilder.provision.domain.service;

import com.cloudbuilder.git.domain.model.ConnectedRepository;
import com.cloudbuilder.git.domain.model.GitPushEvent;
import com.cloudbuilder.git.domain.port.ConnectedRepositoryPort;
import com.cloudbuilder.github.infrastructure.client.GitHubApiClient;
import com.cloudbuilder.provision.domain.model.DriftReport;
import com.cloudbuilder.shared.event.domain.DriftDetectedEvent;
import com.cloudbuilder.shared.security.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Listens for {@link GitPushEvent} and triggers drift detection
 * by comparing the current Terraform state in the repository against
 * the managed resources stored in CloudBuilder.
 * <p>
 * This bridges Git Webhook → Drift Detection, implementing the
 * "webhook-driven drift detection" missing piece.
 * <p>
 * Flow:
 * 1. Git push event received → GitHub webhook parsed commits
 * 2. This listener fetches current .tf state from the repo
 * 3. Converts .tf content to a minimal state JSON representation
 * 4. Passes to DriftDetectionService for comparison against stored state
 * 5. Publishes DriftDetectedEvent so the frontend SSE stream can notify users
 */
@Service
public class PushDriftDetector {

    private static final Logger log = LoggerFactory.getLogger(PushDriftDetector.class);

    private static final Pattern RESOURCE_PATTERN = Pattern.compile(
            "^(resource|data)\\s+\"([^\"]+)\"\\s+\"([^\"]+)\"\\s*\\{",
            Pattern.MULTILINE
    );

    private final ConnectedRepositoryPort repositoryPort;
    private final GitHubApiClient gitHubApiClient;
    private final DriftDetectionService driftDetectionService;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    public PushDriftDetector(ConnectedRepositoryPort repositoryPort,
                              GitHubApiClient gitHubApiClient,
                              DriftDetectionService driftDetectionService,
                              org.springframework.context.ApplicationEventPublisher eventPublisher) {
        this.repositoryPort = repositoryPort;
        this.gitHubApiClient = gitHubApiClient;
        this.driftDetectionService = driftDetectionService;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Triggered on every Git push event. Fetches Terraform state from the
     * repository and runs drift detection against stored managed resources.
     */
    @EventListener
    @Transactional
    public void onGitPushDetectDrift(GitPushEvent event) {
        String repoId = event.getRepoId();
        log.info("Webhook-driven drift detection for repo: {}, branch: {}",
                repoId, event.getBranch());

        ConnectedRepository repo = repositoryPort.findById(repoId).orElse(null);
        if (repo == null) {
            log.warn("Repositório não encontrado para drift detection: {}", repoId);
            return;
        }

        String token = repo.getAccessToken();
        if (token == null || token.isBlank()) {
            log.warn("Token não disponível para drift detection: {}", repo.getFullName());
            return;
        }

        try {
            // ── Step 1: Fetch .tf files from the repo ──
            Map<String, String> tfFiles = fetchAllTfFiles(token, repo.getOwner(),
                    repo.getRepoName(), event.getBranch());

            if (tfFiles.isEmpty()) {
                log.info("Nenhum arquivo .tf encontrado em {}/{} para drift detection",
                        repo.getOwner(), repo.getRepoName());
                return;
            }

            // ── Step 2: Build a minimal state JSON from .tf files ──
            String currentStateJson = buildStateJson(tfFiles);

            // ── Step 3: Run drift detection using repoId as environmentId ──
            String environmentId = repoId;

            DriftReport report = driftDetectionService.detectDrift(environmentId, currentStateJson);

            // ── Step 4: Parse drift details for event payload ──
            int driftCount = 0;
            boolean hasDrift = false;
            if (report.getDriftDetails() != null && !report.getDriftDetails().isBlank()) {
                try {
                    var details = new com.fasterxml.jackson.databind.ObjectMapper()
                            .readTree(report.getDriftDetails());
                    if (details.isArray()) {
                        driftCount = details.size();
                        hasDrift = driftCount > 0;
                    }
                } catch (Exception e) {
                    log.warn("Erro ao analisar detalhes de drift: {}", e.getMessage());
                }
            }

            // ── Step 5: Publish DriftDetectedEvent for SSE notification ──
            String tenantId = TenantContext.getTenantId();
            if (tenantId == null) tenantId = "default";

            DriftDetectedEvent driftEvent = new DriftDetectedEvent(
                    environmentId, report.getId(), driftCount, hasDrift, tenantId);
            eventPublisher.publishEvent(driftEvent);

            log.info("Drift detection concluída para {}: {} drifts encontrados ({})",
                    repo.getFullName(), driftCount, hasDrift ? "com drift" : "sem drift");

        } catch (Exception e) {
            log.error("Erro na drift detection para {}: {}",
                    repo.getFullName(), e.getMessage(), e);
        }
    }

    /**
     * Fetch all .tf file contents from a GitHub repository.
     * Returns a map of file path → file content.
     */
    private Map<String, String> fetchAllTfFiles(String token, String owner,
                                                  String repo, String branch) {
        Map<String, String> files = new HashMap<>();
        String targetBranch = (branch != null && !branch.isBlank()) ? branch : "main";

        try {
            fetchRecursive(token, owner, repo, "", targetBranch, files);
        } catch (Exception e) {
            log.warn("Erro ao buscar arquivos .tf de {}/{}: {}", owner, repo, e.getMessage());
        }

        return files;
    }

    private void fetchRecursive(String token, String owner, String repo,
                                 String path, String branch,
                                 Map<String, String> files) throws Exception {
        var items = gitHubApiClient.listContents(token, owner, repo, path, branch);

        for (var item : items) {
            if ("file".equals(item.type()) && item.name().endsWith(".tf")) {
                try {
                    String content = gitHubApiClient.getFileContent(
                            token, owner, repo, item.path(), branch);
                    if (content != null && !content.isBlank()) {
                        files.put(item.path(), content);
                    }
                } catch (Exception e) {
                    log.debug("Não foi possível ler {}: {}", item.path(), e.getMessage());
                }
            } else if ("dir".equals(item.type())) {
                fetchRecursive(token, owner, repo, item.path(), branch, files);
            }
        }
    }

    /**
     * Build a minimal Terraform state JSON representation from .tf file contents.
     * This creates a simplified state snapshot that DriftDetectionService can compare
     * against the stored ManagedResource entries.
     */
    private String buildStateJson(Map<String, String> tfFiles) {
        StringBuilder json = new StringBuilder();
        json.append("{\"resources\": [");

        boolean first = true;
        for (var entry : tfFiles.entrySet()) {
            String filePath = entry.getKey();
            String content = entry.getValue();

            Matcher matcher = RESOURCE_PATTERN.matcher(content);
            while (matcher.find()) {
                String fullType = matcher.group(2);
                String resourceName = matcher.group(3);

                if (!first) json.append(",");
                first = false;

                json.append("{");
                json.append("\"address\":\"").append(escapeJson(fullType)).append(".")
                        .append(escapeJson(resourceName)).append("\",");
                json.append("\"type\":\"").append(escapeJson(fullType)).append("\",");
                json.append("\"name\":\"").append(escapeJson(resourceName)).append("\",");
                json.append("\"source\":\"").append(escapeJson(filePath)).append("\",");
                json.append("\"instances\":[{\"attributes\":{}}]");
                json.append("}");
            }
        }

        json.append("]}");
        return json.toString();
    }

    private String escapeJson(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
