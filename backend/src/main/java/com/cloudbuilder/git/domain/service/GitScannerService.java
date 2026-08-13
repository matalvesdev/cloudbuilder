package com.cloudbuilder.git.domain.service;

import com.cloudbuilder.git.domain.model.AppDetection;
import com.cloudbuilder.git.domain.model.ConnectedRepository;
import com.cloudbuilder.git.domain.model.RepositoryScan;
import com.cloudbuilder.git.domain.port.ConnectedRepositoryPort;
import com.cloudbuilder.git.domain.port.RepositoryScanPort;
import com.cloudbuilder.github.infrastructure.client.GitHubApiClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
@Service
public class GitScannerService {

    private static final Logger log = LoggerFactory.getLogger(GitScannerService.class);
    private static final int MAX_SCAN_DEPTH = 5;

    private final ConnectedRepositoryPort repositoryPort;
    private final RepositoryScanPort scanPort;
    private final IaCDetector iacDetector;
    private final GitHubApiClient gitHubApiClient;

    public GitScannerService(ConnectedRepositoryPort repositoryPort,
                             RepositoryScanPort scanPort,
                             IaCDetector iacDetector,
                             GitHubApiClient gitHubApiClient) {
        this.repositoryPort = repositoryPort;
        this.scanPort = scanPort;
        this.iacDetector = iacDetector;
        this.gitHubApiClient = gitHubApiClient;
    }

    public RepositoryScan scanRepository(String repositoryId) {
        ConnectedRepository repo = repositoryPort.findById(repositoryId)
                .orElseThrow(() -> new IllegalArgumentException("Repositório não encontrado: " + repositoryId));

        repo.setStatus(ConnectedRepository.Status.SCANNING);
        repositoryPort.save(repo);

        RepositoryScan scan = new RepositoryScan(repositoryId);
        scan.setStatus(RepositoryScan.Status.IN_PROGRESS);
        scanPort.save(scan);

        try {
            List<String> detectedFiles = scanRepositoryFiles(repo);

            String iacFilesJson = buildIacFilesJson(detectedFiles);
            AppDetection appDetection = iacDetector.detectAppType(detectedFiles);
            int resourceCount = iacDetector.detectTerraform(detectedFiles).size()
                    + iacDetector.detectKubernetes(detectedFiles).size();

            scan.setIacFiles(iacFilesJson);
            scan.setAppDetection(appDetection);
            scan.setResourceCount(resourceCount);
            scan.setScannedAt(Instant.now());
            scan.setStatus(RepositoryScan.Status.COMPLETED);

            repo.setLastScanAt(Instant.now());
            repo.setStatus(ConnectedRepository.Status.CONNECTED);
            repositoryPort.save(repo);

            scanPort.save(scan);

            log.info("Scan completed for repository {} — {} files detected, {} IaC resources",
                    repo.getFullName(), detectedFiles.size(), resourceCount);
        } catch (Exception e) {
            log.error("Scan failed for repository {}: {}", repo.getFullName(), e.getMessage());
            scan.setStatus(RepositoryScan.Status.FAILED);
            scanPort.save(scan);

            repo.setStatus(ConnectedRepository.Status.ERROR);
            repositoryPort.save(repo);

            throw new RuntimeException("Erro ao escanear repositório: " + e.getMessage(), e);
        }

        return scan;
    }

    public List<String> getDetectedFiles(String repositoryId) {
        RepositoryScan scan = scanPort.findByRepositoryId(repositoryId).stream()
                .filter(s -> s.getStatus() == RepositoryScan.Status.COMPLETED)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Nenhum scan completo encontrado para o repositório: " + repositoryId));

        if (scan.getIacFiles() == null || scan.getIacFiles().isBlank()) {
            return List.of();
        }

        return List.of(scan.getIacFiles().split(","));
    }

    /**
     * Recursively list all files in a repository via the GitHub API.
     * Falls back to the IaC detector's known file list if the API is unavailable.
     */
    private List<String> scanRepositoryFiles(ConnectedRepository repo) {
        if (!ConnectedRepository.Provider.GITHUB.equals(repo.getProvider())
                || repo.getAccessToken() == null || repo.getAccessToken().isBlank()) {
            log.warn("Repository {} is not connected via GitHub or has no access token — skipping API scan", repo.getFullName());
            return List.of();
        }

        List<String> allFiles = new ArrayList<>();
        try {
            scanDirectory(repo.getAccessToken(), repo.getOwner(), repo.getRepoName(), "", repo.getDefaultBranch(), allFiles, 0);
        } catch (Exception e) {
            log.warn("GitHub API scan failed for {}: {}. Returning empty file list.", repo.getFullName(), e.getMessage());
        }
        return allFiles;
    }

    private void scanDirectory(String token, String owner, String repo, String path, String branch,
                                List<String> allFiles, int depth) throws Exception {
        if (depth > MAX_SCAN_DEPTH) {
            return;
        }

        var contents = gitHubApiClient.listContents(token, owner, repo, path, branch);
        for (var file : contents) {
            if ("file".equals(file.type())) {
                allFiles.add(file.path());
            } else if ("dir".equals(file.type())) {
                scanDirectory(token, owner, repo, file.path(), branch, allFiles, depth + 1);
            }
        }
    }

    private String buildIacFilesJson(List<String> files) {
        return String.join(",", files);
    }
}
