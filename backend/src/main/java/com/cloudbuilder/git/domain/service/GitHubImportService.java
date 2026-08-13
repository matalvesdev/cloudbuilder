package com.cloudbuilder.git.domain.service;

import com.cloudbuilder.git.domain.model.ConnectedRepository;
import com.cloudbuilder.git.domain.port.ConnectedRepositoryPort;
import com.cloudbuilder.github.infrastructure.client.GitHubApiClient;
import com.cloudbuilder.provision.application.dto.CanvasDesign;
import com.cloudbuilder.provision.application.dto.ImportTerraformResponse;
import com.cloudbuilder.provision.application.dto.ParsedConnection;
import com.cloudbuilder.provision.application.dto.ParsedResource;
import com.cloudbuilder.provision.domain.service.TerraformImportService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for reverse-importing Terraform files from a connected GitHub repository
 * into CloudBuilder canvas designs.
 * <p>
 * Flow:
 * 1. Fetch .tf files from a GitHub repo using GitHubApiClient
 * 2. Parse each .tf file using TerraformImportService
 * 3. Merge parsed resources into CanvasDesign-like structure
 * 4. Return for frontend consumption or direct persistence
 */
@Service
public class GitHubImportService {

    private static final Logger log = LoggerFactory.getLogger(GitHubImportService.class);
    private static final List<String> TF_EXTENSIONS = List.of(".tf", ".tfvars");

    private final ConnectedRepositoryPort repositoryPort;
    private final GitHubApiClient gitHubApiClient;
    private final TerraformImportService terraformImportService;

    public GitHubImportService(ConnectedRepositoryPort repositoryPort,
                                GitHubApiClient gitHubApiClient,
                                TerraformImportService terraformImportService) {
        this.repositoryPort = repositoryPort;
        this.gitHubApiClient = gitHubApiClient;
        this.terraformImportService = terraformImportService;
    }

    /**
     * Import Terraform files from a connected GitHub repository.
     *
     * @param repositoryId the connected repository ID
     * @param path         subdirectory path within the repo (empty for root)
     * @param branch       branch to fetch from (default: repo default branch)
     * @return import result with parsed resources, connections, warnings and nodes
     */
    @Transactional(readOnly = true)
    public ReverseImportResult importFromGitHub(String repositoryId, String path, String branch) {
        ConnectedRepository repo = repositoryPort.findById(repositoryId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Repositório não encontrado: " + repositoryId));

        String token = repo.getAccessToken();
        if (token == null || token.isBlank()) {
            return ReverseImportResult.error("Token de acesso não disponível para: " + repo.getFullName());
        }

        String owner = repo.getOwner();
        String repoName = repo.getRepoName();
        String targetBranch = branch != null ? branch : repo.getDefaultBranch();

        try {
            // ── Step 1: Find all .tf files in the repo path ──
            List<String> tfFiles = findTerraformFiles(token, owner, repoName, path, targetBranch);

            if (tfFiles.isEmpty()) {
                return ReverseImportResult.error("Nenhum arquivo .tf encontrado em " + path);
            }

            // ── Step 2: Fetch and parse each .tf file ──
            List<ParsedResource> allResources = new ArrayList<>();
            List<ParsedConnection> allConnections = new ArrayList<>();
            List<String> allWarnings = new ArrayList<>();
            Map<String, String> fileContents = new LinkedHashMap<>();

            for (String filePath : tfFiles) {
                try {
                    String content = gitHubApiClient.getFileContent(token, owner, repoName, filePath, targetBranch);
                    if (content == null || content.isBlank()) continue;

                    fileContents.put(filePath, content);
                    ImportTerraformResponse parsed = terraformImportService.parse(content);

                    allResources.addAll(parsed.resources());
                    allConnections.addAll(parsed.connections());
                    allWarnings.addAll(parsed.warnings());
                } catch (Exception e) {
                    log.warn("Erro ao processar {}: {}", filePath, e.getMessage());
                    allWarnings.add("Falha ao processar " + filePath + ": " + e.getMessage());
                }
            }

            // ── Step 3: Deduplicate resources by type+name ──
            Set<String> seen = new LinkedHashSet<>();
            List<ParsedResource> uniqueResources = new ArrayList<>();
            for (ParsedResource r : allResources) {
                String key = r.resourceType() + "." + r.name();
                if (seen.add(key)) {
                    uniqueResources.add(r);
                }
            }

            // ── Step 4: Build canvas-style design nodes from parsed resources ──
            List<CanvasDesign.DesignNode> designNodes = new ArrayList<>();
            double xPos = 50;
            double yPos = 50;
            int col = 0;

            for (ParsedResource resource : uniqueResources) {
                Map<String, String> props = new LinkedHashMap<>(resource.properties());
                props.putIfAbsent("resourceType", resource.resourceType());
                props.putIfAbsent("displayType", resource.displayType());

                designNodes.add(new CanvasDesign.DesignNode(
                        UUID.randomUUID().toString(),
                        resource.resourceType(),
                        resource.provider(),
                        props,
                        xPos,
                        yPos
                ));

                // Grid layout: 3 columns
                col++;
                if (col >= 3) {
                    col = 0;
                    xPos = 50;
                    yPos += 180;
                } else {
                    xPos += 280;
                }
            }

            // ── Step 5: Build design edges from connections ──
            List<CanvasDesign.DesignEdge> designEdges = buildEdgesFromConnections(allConnections, uniqueResources, designNodes);

            log.info("Importados {} recursos únicos de {} arquivos .tf do repo {}/{}",
                    uniqueResources.size(), tfFiles.size(), owner, repoName);

            return new ReverseImportResult(
                    uniqueResources,
                    allConnections,
                    allWarnings,
                    designNodes,
                    designEdges,
                    fileContents
            );

        } catch (Exception e) {
            log.error("Erro ao importar do GitHub: {}", e.getMessage(), e);
            return ReverseImportResult.error("Falha ao importar: " + e.getMessage());
        }
    }

    /**
     * Recursively find all .tf files in a repository path.
     */
    private List<String> findTerraformFiles(String token, String owner, String repo,
                                             String path, String branch) throws Exception {
        List<String> tfFiles = new ArrayList<>();
        List<GitHubApiClient.GitHubFile> items;

        try {
            items = gitHubApiClient.listContents(token, owner, repo, path, branch);
        } catch (Exception e) {
            log.warn("Erro ao listar conteúdo de {}/{}: {}", owner, repo, e.getMessage());
            return tfFiles;
        }

        for (GitHubApiClient.GitHubFile item : items) {
            if ("file".equals(item.type()) && isTerraformFile(item.name())) {
                tfFiles.add(item.path());
            } else if ("dir".equals(item.type())) {
                // Recurse into subdirectories (limit depth to avoid runaway)
                tfFiles.addAll(findTerraformFiles(token, owner, repo, item.path(), branch));
            }
        }

        return tfFiles;
    }

    private boolean isTerraformFile(String fileName) {
        return TF_EXTENSIONS.stream().anyMatch(fileName::endsWith);
    }

    /**
     * Build DesignEdge list from parsed connections, mapping resource names to node IDs.
     */
    private List<CanvasDesign.DesignEdge> buildEdgesFromConnections(
            List<ParsedConnection> connections,
            List<ParsedResource> resources,
            List<CanvasDesign.DesignNode> nodes) {

        // Build lookup: resourceType.resourceName → nodeId
        Map<String, String> resourceToNodeId = new HashMap<>();
        for (int i = 0; i < resources.size() && i < nodes.size(); i++) {
            String key = resources.get(i).resourceType() + "." + resources.get(i).name();
            resourceToNodeId.put(key, nodes.get(i).id());
        }

        List<CanvasDesign.DesignEdge> edges = new ArrayList<>();
        Set<String> seenEdges = new LinkedHashSet<>();

        for (ParsedConnection conn : connections) {
            String sourceResource = conn.sourceResourceName();  // format: "type.name"
            String targetResource = conn.targetResourceName();

            String sourceId = resourceToNodeId.get(sourceResource);
            String targetId = resourceToNodeId.get(targetResource);

            if (sourceId != null && targetId != null) {
                String edgeKey = sourceId + "->" + targetId;
                if (seenEdges.add(edgeKey)) {
                    edges.add(new CanvasDesign.DesignEdge(
                            UUID.randomUUID().toString(),
                            sourceId,
                            targetId,
                            "connection"
                    ));
                }
            }
        }

        return edges;
    }

    // ── Result DTO ──

    public record ReverseImportResult(
            List<ParsedResource> resources,
            List<ParsedConnection> connections,
            List<String> warnings,
            List<CanvasDesign.DesignNode> designNodes,
            List<CanvasDesign.DesignEdge> designEdges,
            Map<String, String> fileContents
    ) {
        public static ReverseImportResult error(String message) {
            return new ReverseImportResult(
                    List.of(), List.of(), List.of(message),
                    List.of(), List.of(), Map.of()
            );
        }

        public boolean isSuccess() {
            return warnings.stream().noneMatch(w -> w.startsWith("Falha") || w.startsWith("Nenhum") || w.startsWith("Token"));
        }
    }
}
