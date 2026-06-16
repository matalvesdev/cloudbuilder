package com.cloudbuilder.provision.application.dto;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public record CanvasDesign(
    UUID id,
    String name,
    List<DesignNode> nodes,
    List<DesignEdge> edges
) {
    public record DesignNode(
        String id,
        String resourceType,
        String provider,
        Map<String, String> properties,
        Double positionX,
        Double positionY
    ) {}

    public record DesignEdge(
        String id,
        String sourceId,
        String targetId,
        String type
    ) {}
}
