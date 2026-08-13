package com.cloudbuilder.git.domain.service;

import com.cloudbuilder.git.application.dto.GitWriteRequest;
import com.cloudbuilder.git.application.dto.GitWriteResponse;
import com.cloudbuilder.git.domain.model.ConnectedRepository;
import com.cloudbuilder.git.domain.port.ConnectedRepositoryPort;
import com.cloudbuilder.github.infrastructure.client.GitHubApiClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

/**
 * Service for writing generated infrastructure code (Terraform/OpenTofu .tf files)
 * to a connected GitHub repository and optionally creating a Pull Request.
 * <p>
 * Flow:
 * 1. Receive generated code (map of filename → content)
 * 2. Look up the connected repository for token/owner/repo
 * 3. For direct commits: write files to the default branch
 * 4. For PR flow: create feature branch → write files → create PR
 */
@Service
public class GitWriterService {

    private static final Logger log = LoggerFactory.getLogger(GitWriterService.class);

    private final ConnectedRepositoryPort repositoryPort;
    private final GitHubApiClient gitHubApiClient;

    public GitWriterService(ConnectedRepositoryPort repositoryPort,
                            GitHubApiClient gitHubApiClient) {
        this.repositoryPort = repositoryPort;
        this.gitHubApiClient = gitHubApiClient;
    }

    /**
     * Write generated infrastructure files to a connected GitHub repository.
     *
     * @param request the write request containing repository info, files, and PR options
     * @return response with details of what was written and any PR created
     */
    @Transactional
    public GitWriteResponse writeFiles(GitWriteRequest request) {
        ConnectedRepository repo = repositoryPort.findById(request.getRepositoryId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Repositório não encontrado: " + request.getRepositoryId()));

        if (repo.getAccessToken() == null || repo.getAccessToken().isBlank()) {
            return GitWriteResponse.error("Token de acesso não disponível para o repositório: "
                    + repo.getFullName());
        }

        String token = repo.getAccessToken();
        String owner = repo.getOwner();
        String repoName = repo.getRepoName();
        String defaultBranch = repo.getDefaultBranch() != null ? repo.getDefaultBranch() : "main";
        String commitMessage = request.getCommitMessage() != null
                ? request.getCommitMessage()
                : "feat(infra): atualizar infraestrutura via CloudBuilder [" + Instant.now().toString() + "]";

        try {
            Map<String, String> files = request.getFiles();
            List<String> filesWritten = new ArrayList<>();
            Map<String, String> fileShas = new LinkedHashMap<>();

            if (request.isCreatePullRequest()) {
                // ── PR flow: feature branch → write files → PR ──
                String branchName = request.getBranchName() != null
                        ? request.getBranchName()
                        : "cloudbuilder/" + UUID.randomUUID().toString().substring(0, 8);

                // Get base SHA from default branch
                String baseSha = gitHubApiClient.getDefaultBranchSha(token, owner, repoName);

                // Create feature branch
                gitHubApiClient.createBranch(token, owner, repoName, branchName, baseSha);

                // Write each file to the feature branch
                for (var entry : files.entrySet()) {
                    String filePath = entry.getKey();
                    String content = entry.getValue();

                    String existingSha = gitHubApiClient.getFileSha(token, owner, repoName, filePath, branchName);
                    gitHubApiClient.createOrUpdateFile(token, owner, repoName, filePath,
                            content, commitMessage, branchName, existingSha);

                    filesWritten.add(filePath);
                    fileShas.put(filePath, existingSha != null ? existingSha : "created");
                }

                // Create PR
                String prTitle = request.getPrTitle() != null
                        ? request.getPrTitle()
                        : "feat(infra): atualizar infraestrutura via CloudBuilder";
                String prBody = request.getPrBody() != null
                        ? request.getPrBody()
                        : "Atualização de infraestrutura gerada pelo CloudBuilder.\n\n"
                        + "**Arquivos:**\n" + String.join("\n", filesWritten.stream()
                                .map(f -> "- `" + f + "`").toList());

                var prResult = gitHubApiClient.createPullRequest(token, owner, repoName,
                        prTitle, prBody, branchName, defaultBranch);

                String prUrl = prResult.has("html_url") ? prResult.get("html_url").asText() : null;
                int prNumber = prResult.has("number") ? prResult.get("number").asInt() : 0;

                log.info("PR criado para {}: {} (#{})", repo.getFullName(), prUrl, prNumber);

                return GitWriteResponse.withPullRequest(
                        request.getRepositoryId(), branchName, prUrl, prNumber,
                        filesWritten, fileShas);

            } else {
                // ── Direct commit flow: write files to default branch ──
                String targetBranch = request.getBranchName() != null
                        ? request.getBranchName()
                        : defaultBranch;

                for (var entry : files.entrySet()) {
                    String filePath = entry.getKey();
                    String content = entry.getValue();

                    String existingSha = gitHubApiClient.getFileSha(token, owner, repoName, filePath, targetBranch);
                    gitHubApiClient.createOrUpdateFile(token, owner, repoName, filePath,
                            content, commitMessage, targetBranch, existingSha);

                    filesWritten.add(filePath);
                    fileShas.put(filePath, existingSha != null ? existingSha : "created");
                }

                log.info("Arquivos escritos diretamente em {}/{} (branch: {})",
                        owner, repoName, targetBranch);

                return GitWriteResponse.success(
                        request.getRepositoryId(), targetBranch, filesWritten, fileShas);
            }

        } catch (Exception e) {
            log.error("Erro ao escrever arquivos no repositório {}: {}",
                    repo.getFullName(), e.getMessage(), e);
            return GitWriteResponse.error("Falha ao escrever arquivos: " + e.getMessage());
        }
    }
}
