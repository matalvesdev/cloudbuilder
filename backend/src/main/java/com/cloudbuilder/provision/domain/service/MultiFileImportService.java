package com.cloudbuilder.provision.domain.service;

import com.cloudbuilder.provision.application.dto.ParsedConnection;
import com.cloudbuilder.provision.application.dto.ParsedResource;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Merges multiple Terraform/JSON files into a single normalized resource list.
 * Handles deduplication of resources across files and cross-file reference resolution.
 */
@Service
public class MultiFileImportService {

    private final TerraformImportService terraformImportService;
    private final TerraformStateImportService stateImportService;

    public MultiFileImportService(
            TerraformImportService terraformImportService,
            TerraformStateImportService stateImportService
    ) {
        this.terraformImportService = terraformImportService;
        this.stateImportService = stateImportService;
    }

    /**
     * Parse multiple files and merge results.
     *
     * @param files List of (fileName, content) pairs
     * @return Merged import result with deduplicated resources and cross-file connections
     */
    public MultiImportResult parseMulti(List<MultiFileEntry> files) {
        List<String> warnings = new ArrayList<>();
        Map<String, ParsedResource> mergedResourceMap = new LinkedHashMap<>();
        List<ParsedConnection> allConnections = new ArrayList<>();

        if (files == null || files.isEmpty()) {
            return new MultiImportResult(List.of(), List.of(), List.of("Nenhum arquivo fornecido"), 0);
        }

        for (MultiFileEntry file : files) {
            String fileName = file.fileName() != null ? file.fileName() : "unknown";
            String content = file.content();

            if (content == null || content.isBlank()) {
                warnings.add("Arquivo " + fileName + " está vazio, ignorado.");
                continue;
            }

            String ext = getExtension(fileName);

            try {
                switch (ext) {
                    case "tf":
                    case "tf.json":
                    case "hcl":
                        parseAndMergeHcl(content, mergedResourceMap, allConnections, warnings);
                        break;
                    case "tfstate":
                    case "tfstate.json":
                        parseAndMergeState(content, mergedResourceMap, allConnections, warnings);
                        break;
                    case "json":
                        // Try state format first, then fallback to generic JSON
                        if (!tryParseAsState(content, mergedResourceMap, allConnections, warnings)) {
                            warnings.add("Arquivo " + fileName + ": formato JSON não reconhecido como .tfstate.");
                        }
                        break;
                    default:
                        warnings.add("Arquivo " + fileName + " com extensão '" + ext + "' não suportado.");
                }
            } catch (Exception e) {
                warnings.add("Erro ao processar " + fileName + ": " + e.getMessage());
            }
        }

        // Detect cross-file connections based on resource references
        List<ParsedConnection> crossFileConnections = detectCrossFileConnections(mergedResourceMap);
        allConnections.addAll(crossFileConnections);

        // Deduplicate connections
        Set<String> seen = new HashSet<>();
        List<ParsedConnection> deduplicatedConnections = allConnections.stream()
            .filter(c -> seen.add(c.sourceResourceName() + "->" + c.targetResourceName()))
            .collect(Collectors.toList());

        List<ParsedResource> mergedResources = new ArrayList<>(mergedResourceMap.values());

        return new MultiImportResult(mergedResources, deduplicatedConnections, warnings, mergedResources.size());
    }

    private void parseAndMergeHcl(String content, Map<String, ParsedResource> resourceMap,
                                   List<ParsedConnection> connections, List<String> warnings) {
        var result = terraformImportService.parse(content);
        for (ParsedResource res : result.resources()) {
            String key = res.resourceType() + "." + res.name();
            resourceMap.put(key, res);
        }
        connections.addAll(result.connections());
        warnings.addAll(result.warnings());
    }

    private void parseAndMergeState(String content, Map<String, ParsedResource> resourceMap,
                                     List<ParsedConnection> connections, List<String> warnings) {
        var result = stateImportService.parse(content);
        for (ParsedResource res : result.resources()) {
            String key = res.resourceType() + "." + res.name();
            resourceMap.put(key, res);
        }
        connections.addAll(result.connections());
        warnings.addAll(result.warnings());
    }

    private boolean tryParseAsState(String content, Map<String, ParsedResource> resourceMap,
                                     List<ParsedConnection> connections, List<String> warnings) {
        // Quick check: state files have a "resources" array at root
        if (content.trim().startsWith("{") && content.contains("\"resources\"")) {
            parseAndMergeState(content, resourceMap, connections, warnings);
            return true;
        }
        return false;
    }

    private List<ParsedConnection> detectCrossFileConnections(Map<String, ParsedResource> resourceMap) {
        List<ParsedConnection> connections = new ArrayList<>();
        Set<String> seen = new HashSet<>();

        // Simple cross-reference detection based on property naming conventions
        for (ParsedResource resource : resourceMap.values()) {
            for (var entry : resource.properties().entrySet()) {
                String attrKey = entry.getKey();
                String attrValue = entry.getValue();

                // Attribute ending in "_id" likely references another resource
                if (attrKey.endsWith("_id") && !attrKey.equals("id") && !attrValue.isBlank()) {
                    String baseType = attrKey.replace("_id", "");

                    for (ParsedResource target : resourceMap.values()) {
                        if (target == resource) continue;
                        String targetId = target.properties().get("id");
                        if (targetId != null && targetId.equals(attrValue)) {
                            String connKey = resource.resourceType() + "." + resource.name()
                                + "->" + target.resourceType() + "." + target.name();
                            if (seen.add(connKey)) {
                                connections.add(new ParsedConnection(
                                    resource.resourceType() + "." + resource.name(),
                                    target.resourceType() + "." + target.name()
                                ));
                            }
                        }
                    }
                }
            }
        }

        return connections;
    }

    private String getExtension(String fileName) {
        int dotIdx = fileName.lastIndexOf('.');
        if (dotIdx < 0) return "";
        return fileName.substring(dotIdx + 1).toLowerCase();
    }

    public record MultiFileEntry(String fileName, String content) {}

    public record MultiImportResult(
        List<ParsedResource> resources,
        List<ParsedConnection> connections,
        List<String> warnings,
        int resourceCount
    ) {}
}
