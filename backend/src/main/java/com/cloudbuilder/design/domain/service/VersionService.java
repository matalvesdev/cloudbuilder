package com.cloudbuilder.design.domain.service;

import com.cloudbuilder.design.application.dto.VersionDiff;
import com.cloudbuilder.design.application.dto.VersionDiff.DiffEntry;
import com.cloudbuilder.design.domain.model.Canvas;
import com.cloudbuilder.design.domain.model.CanvasEdge;
import com.cloudbuilder.design.domain.model.CanvasNode;
import com.cloudbuilder.design.domain.model.CanvasVersion;
import com.cloudbuilder.design.domain.port.CanvasRepository;
import com.cloudbuilder.design.domain.port.CanvasVersionRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class VersionService {

    private final CanvasRepository canvasRepository;
    private final CanvasVersionRepository versionRepository;
    private final ObjectMapper objectMapper;

    public VersionService(CanvasRepository canvasRepository, CanvasVersionRepository versionRepository, ObjectMapper objectMapper) {
        this.canvasRepository = canvasRepository;
        this.versionRepository = versionRepository;
        this.objectMapper = objectMapper;
    }

    public CanvasVersion createVersion(UUID canvasId, String changeDescription, String userId) {
        Canvas canvas = canvasRepository.findById(canvasId)
                .orElseThrow(() -> new RuntimeException("Canvas not found: " + canvasId));

        String snapshot = buildSnapshot(canvas);
        int nextVersion = versionRepository.findTopByCanvasIdOrderByVersionDesc(canvasId)
                .map(v -> v.getVersion() + 1)
                .orElse(1);

        CanvasVersion version = new CanvasVersion(canvasId, nextVersion, snapshot, changeDescription, userId);
        return versionRepository.save(version);
    }

    @Transactional(readOnly = true)
    public List<CanvasVersion> getVersions(UUID canvasId) {
        return versionRepository.findByCanvasIdOrderByVersionDesc(canvasId);
    }

    @Transactional(readOnly = true)
    public CanvasVersion getVersion(UUID canvasId, int version) {
        return versionRepository.findByCanvasIdAndVersion(canvasId, version)
                .orElseThrow(() -> new RuntimeException("Version not found: " + version + " for canvas: " + canvasId));
    }

    public Canvas rollbackToVersion(UUID canvasId, int version) {
        CanvasVersion targetVersion = getVersion(canvasId, version);
        Canvas canvas = canvasRepository.findById(canvasId)
                .orElseThrow(() -> new RuntimeException("Canvas not found: " + canvasId));

        restoreFromSnapshot(canvas, targetVersion.getSnapshot());
        canvas.incrementVersion();
        canvasRepository.save(canvas);

        createVersion(canvasId, "Rolled back to version " + version, "system");
        return canvas;
    }

    @Transactional(readOnly = true)
    public Optional<CanvasVersion> getLatestVersion(UUID canvasId) {
        return versionRepository.findTopByCanvasIdOrderByVersionDesc(canvasId);
    }

    @Transactional(readOnly = true)
    public VersionDiff diffVersions(UUID canvasId, int versionA, int versionB) {
        CanvasVersion vA = getVersion(canvasId, versionA);
        CanvasVersion vB = getVersion(canvasId, versionB);

        Map<String, JsonNode> nodesA = extractNodes(vA.getSnapshot());
        Map<String, JsonNode> nodesB = extractNodes(vB.getSnapshot());
        Map<String, JsonNode> edgesA = extractEdges(vA.getSnapshot());
        Map<String, JsonNode> edgesB = extractEdges(vB.getSnapshot());

        Set<String> nodeIdsA = nodesA.keySet();
        Set<String> nodeIdsB = nodesB.keySet();

        List<DiffEntry> nodesAdded = new ArrayList<>();
        List<DiffEntry> nodesRemoved = new ArrayList<>();
        List<DiffEntry> nodesModified = new ArrayList<>();

        Set<String> addedNodes = new HashSet<>(nodeIdsB);
        addedNodes.removeAll(nodeIdsA);
        for (String id : addedNodes) {
            JsonNode node = nodesB.get(id);
            nodesAdded.add(new DiffEntry(id, nodePath(node), "ADDED", "Added to canvas"));
        }

        Set<String> removedNodes = new HashSet<>(nodeIdsA);
        removedNodes.removeAll(nodeIdsB);
        for (String id : removedNodes) {
            JsonNode node = nodesA.get(id);
            nodesRemoved.add(new DiffEntry(id, nodePath(node), "REMOVED", "Removed from canvas"));
        }

        Set<String> commonNodes = new HashSet<>(nodeIdsA);
        commonNodes.retainAll(nodeIdsB);
        for (String id : commonNodes) {
            JsonNode nodeA = nodesA.get(id);
            JsonNode nodeB = nodesB.get(id);
            String details = diffNodeProperties(nodeA, nodeB);
            if (details != null) {
                nodesModified.add(new DiffEntry(id, nodePath(nodeB), "MODIFIED", details));
            }
        }

        Set<String> edgeIdsA = edgesA.keySet();
        Set<String> edgeIdsB = edgesB.keySet();

        List<DiffEntry> edgesAdded = new ArrayList<>();
        List<DiffEntry> edgesRemoved = new ArrayList<>();

        Set<String> addedEdges = new HashSet<>(edgeIdsB);
        addedEdges.removeAll(edgeIdsA);
        for (String id : addedEdges) {
            JsonNode edge = edgesB.get(id);
            edgesAdded.add(new DiffEntry(id, edgeLabel(edge), "ADDED", "Connection added"));
        }

        Set<String> removedEdges = new HashSet<>(edgeIdsA);
        removedEdges.removeAll(edgeIdsB);
        for (String id : removedEdges) {
            JsonNode edge = edgesA.get(id);
            edgesRemoved.add(new DiffEntry(id, edgeLabel(edge), "REMOVED", "Connection removed"));
        }

        return new VersionDiff(canvasId, versionA, versionB, nodesAdded, nodesRemoved, nodesModified, edgesAdded, edgesRemoved);
    }

    private String buildSnapshot(Canvas canvas) {
        ObjectNode root = objectMapper.createObjectNode();

        com.fasterxml.jackson.databind.node.ArrayNode nodesArray = root.putArray("nodes");
        for (CanvasNode node : canvas.getCanvasNodes()) {
            ObjectNode nodeObj = nodesArray.addObject();
            nodeObj.put("id", node.getId().toString());
            nodeObj.put("componentDefinitionId", node.getComponentDefinitionId());
            nodeObj.put("positionX", node.getPositionX());
            nodeObj.put("positionY", node.getPositionY());
            if (node.getProperties() != null) {
                nodeObj.put("properties", node.getProperties());
            }
            if (node.getValidationStatus() != null) {
                nodeObj.put("validationStatus", node.getValidationStatus());
            }
        }

        com.fasterxml.jackson.databind.node.ArrayNode edgesArray = root.putArray("edges");
        for (CanvasEdge edge : canvas.getCanvasEdges()) {
            ObjectNode edgeObj = edgesArray.addObject();
            edgeObj.put("id", edge.getId().toString());
            edgeObj.put("sourceNodeId", edge.getSourceNodeId().toString());
            edgeObj.put("targetNodeId", edge.getTargetNodeId().toString());
            edgeObj.put("edgeType", edge.getEdgeType());
            if (edge.getProperties() != null) {
                edgeObj.put("properties", edge.getProperties());
            }
        }

        return root.toString();
    }

    private void restoreFromSnapshot(Canvas canvas, String snapshot) {
        try {
            JsonNode root = objectMapper.readTree(snapshot);

            canvas.getCanvasNodes().clear();
            canvas.getCanvasEdges().clear();

            JsonNode nodesArray = root.get("nodes");
            if (nodesArray != null && nodesArray.isArray()) {
                for (JsonNode nodeNode : nodesArray) {
                    CanvasNode node = new CanvasNode(
                            canvas,
                            nodeNode.get("componentDefinitionId").asText(),
                            nodeNode.get("positionX").asDouble(),
                            nodeNode.get("positionY").asDouble(),
                            nodeNode.has("properties") ? nodeNode.get("properties").asText() : null
                    );
                    if (nodeNode.has("validationStatus")) {
                        node.setValidationStatus(nodeNode.get("validationStatus").asText());
                    }
                    canvas.addNode(node);
                }
            }

            JsonNode edgesArray = root.get("edges");
            if (edgesArray != null && edgesArray.isArray()) {
                for (JsonNode edgeNode : edgesArray) {
                    CanvasEdge edge = new CanvasEdge(
                            canvas,
                            UUID.fromString(edgeNode.get("sourceNodeId").asText()),
                            UUID.fromString(edgeNode.get("targetNodeId").asText()),
                            edgeNode.get("edgeType").asText(),
                            edgeNode.has("properties") ? edgeNode.get("properties").asText() : null
                    );
                    canvas.addEdge(edge);
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to restore canvas from snapshot", e);
        }
    }

    private Map<String, JsonNode> extractNodes(String snapshot) {
        Map<String, JsonNode> map = new HashMap<>();
        try {
            JsonNode root = objectMapper.readTree(snapshot);
            JsonNode nodesArray = root.get("nodes");
            if (nodesArray != null && nodesArray.isArray()) {
                for (JsonNode node : nodesArray) {
                    map.put(node.get("id").asText(), node);
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse snapshot", e);
        }
        return map;
    }

    private Map<String, JsonNode> extractEdges(String snapshot) {
        Map<String, JsonNode> map = new HashMap<>();
        try {
            JsonNode root = objectMapper.readTree(snapshot);
            JsonNode edgesArray = root.get("edges");
            if (edgesArray != null && edgesArray.isArray()) {
                for (JsonNode edge : edgesArray) {
                    map.put(edge.get("id").asText(), edge);
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse snapshot", e);
        }
        return map;
    }

    private String nodePath(JsonNode node) {
        if (node != null && node.has("componentDefinitionId")) {
            return node.get("componentDefinitionId").asText("");
        }
        return "unknown";
    }

    private String edgeLabel(JsonNode edge) {
        if (edge != null && edge.has("edgeType")) {
            return edge.get("edgeType").asText("connection");
        }
        return "connection";
    }

    private String diffNodeProperties(JsonNode nodeA, JsonNode nodeB) {
        List<String> changes = new ArrayList<>();

        double posXA = nodeA.has("positionX") ? nodeA.get("positionX").asDouble() : 0;
        double posXB = nodeB.has("positionX") ? nodeB.get("positionX").asDouble() : 0;
        if (Math.abs(posXA - posXB) > 0.001) {
            changes.add("position changed");
        }

        double posYA = nodeA.has("positionY") ? nodeA.get("positionY").asDouble() : 0;
        double posYB = nodeB.has("positionY") ? nodeB.get("positionY").asDouble() : 0;
        if (Math.abs(posYA - posYB) > 0.001) {
            changes.add("position changed");
        }

        String propsA = nodeA.has("properties") ? nodeA.get("properties").asText("") : "";
        String propsB = nodeB.has("properties") ? nodeB.get("properties").asText("") : "";
        if (!propsA.equals(propsB)) {
            changes.add("properties modified");
        }

        return changes.isEmpty() ? null : String.join(", ", changes);
    }
}
