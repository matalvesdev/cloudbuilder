package com.cloudbuilder.git.domain.service;

import com.cloudbuilder.git.domain.model.AppDetection;
import com.cloudbuilder.git.domain.model.ConnectedRepository;
import com.cloudbuilder.git.domain.model.RepositoryScan;
import com.cloudbuilder.git.domain.port.ConnectedRepositoryPort;
import com.cloudbuilder.git.domain.port.RepositoryScanPort;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class GitScannerService {

    private final ConnectedRepositoryPort repositoryPort;
    private final RepositoryScanPort scanPort;
    private final IaCDetector iacDetector;

    public GitScannerService(ConnectedRepositoryPort repositoryPort,
                             RepositoryScanPort scanPort,
                             IaCDetector iacDetector) {
        this.repositoryPort = repositoryPort;
        this.scanPort = scanPort;
        this.iacDetector = iacDetector;
    }

    public RepositoryScan scanRepository(UUID repositoryId) {
        ConnectedRepository repo = repositoryPort.findById(repositoryId)
                .orElseThrow(() -> new IllegalArgumentException("Repositório não encontrado: " + repositoryId));

        repo.setStatus(ConnectedRepository.Status.SCANNING);
        repositoryPort.save(repo);

        RepositoryScan scan = new RepositoryScan(repositoryId);
        scan.setStatus(RepositoryScan.Status.IN_PROGRESS);
        scanPort.save(scan);

        try {
            List<String> detectedFiles = simulateScan(repo);

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
        } catch (Exception e) {
            scan.setStatus(RepositoryScan.Status.FAILED);
            scanPort.save(scan);

            repo.setStatus(ConnectedRepository.Status.ERROR);
            repositoryPort.save(repo);

            throw new RuntimeException("Erro ao escanear repositório: " + e.getMessage(), e);
        }

        return scan;
    }

    public List<String> getDetectedFiles(UUID repositoryId) {
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

    private List<String> simulateScan(ConnectedRepository repo) {
        return List.of(
                "main.tf",
                "variables.tf",
                "outputs.tf",
                "provider.tf",
                "Dockerfile",
                "deployment.yaml",
                "service.yaml",
                "src/main/java/com/example/Application.java",
                "pom.xml",
                "src/main/resources/application.yml",
                ".github/workflows/deploy.yml",
                "README.md"
        );
    }

    private String buildIacFilesJson(List<String> files) {
        return String.join(",", files);
    }
}
