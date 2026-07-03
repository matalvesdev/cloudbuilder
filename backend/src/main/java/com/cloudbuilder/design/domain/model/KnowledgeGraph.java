package com.cloudbuilder.design.domain.model;

import java.util.*;

/**
 * In-memory knowledge graph that maps relationships between architecture components.
 * Nodes represent components (services, APIs, databases, etc.) and edges represent
 * relationships (depends-on, communicates-with, owns, etc.).
 */
public class KnowledgeGraph {

    private final Map<String, GraphNode> nodes = new LinkedHashMap<>();
    private final List<GraphEdge> edges = new ArrayList<>();

    public void addNode(String id, String label, String type, Map<String, String> metadata) {
        nodes.put(id, new GraphNode(id, label, type, metadata != null ? metadata : Map.of()));
    }

    public void addEdge(String sourceId, String targetId, String relationship, Map<String, String> metadata) {
        edges.add(new GraphEdge(sourceId, targetId, relationship, metadata != null ? metadata : Map.of()));
    }

    public Optional<GraphNode> getNode(String id) {
        return Optional.ofNullable(nodes.get(id));
    }

    public Collection<GraphNode> getNodes() {
        return Collections.unmodifiableCollection(nodes.values());
    }

    public List<GraphEdge> getEdges() {
        return Collections.unmodifiableList(edges);
    }

    /** Get all nodes of a given type. */
    public List<GraphNode> getNodesByType(String type) {
        return nodes.values().stream()
                .filter(n -> n.type().equals(type))
                .toList();
    }

    /** Get direct neighbors of a node (both directions). */
    public List<GraphEdge> getNeighbors(String nodeId) {
        return edges.stream()
                .filter(e -> e.sourceId().equals(nodeId) || e.targetId().equals(nodeId))
                .toList();
    }

    /** Get all nodes that depend on a given node (outgoing edges). */
    public List<GraphNode> getDependents(String nodeId) {
        return edges.stream()
                .filter(e -> e.sourceId().equals(nodeId))
                .map(e -> nodes.get(e.targetId()))
                .filter(Objects::nonNull)
                .toList();
    }

    /** Get all nodes that a given node depends on (incoming edges). */
    public List<GraphNode> getDependencies(String nodeId) {
        return edges.stream()
                .filter(e -> e.targetId().equals(nodeId))
                .map(e -> nodes.get(e.sourceId()))
                .filter(Objects::nonNull)
                .toList();
    }

    /** Find the impact of removing a node (transitive dependents). */
    public Set<String> findImpact(String nodeId) {
        Set<String> visited = new HashSet<>();
        Queue<String> queue = new LinkedList<>();
        queue.add(nodeId);
        while (!queue.isEmpty()) {
            String current = queue.poll();
            for (GraphEdge edge : edges) {
                if (edge.sourceId().equals(current) && !visited.contains(edge.targetId())) {
                    visited.add(edge.targetId());
                    queue.add(edge.targetId());
                }
            }
        }
        return visited;
    }

    /** Convert to a map representation for JSON serialization. */
    public Map<String, Object> toMap() {
        return Map.of(
            "nodes", nodes.values().stream().map(GraphNode::toMap).toList(),
            "edges", edges.stream().map(GraphEdge::toMap).toList()
        );
    }

    public int nodeCount() { return nodes.size(); }
    public int edgeCount() { return edges.size(); }

    public record GraphNode(String id, String label, String type, Map<String, String> metadata) {
        public Map<String, Object> toMap() {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", id);
            map.put("label", label);
            map.put("type", type);
            map.put("metadata", metadata);
            return map;
        }
    }

    public record GraphEdge(String sourceId, String targetId, String relationship, Map<String, String> metadata) {
        public Map<String, Object> toMap() {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("sourceId", sourceId);
            map.put("targetId", targetId);
            map.put("relationship", relationship);
            map.put("metadata", metadata);
            return map;
        }
    }
}
