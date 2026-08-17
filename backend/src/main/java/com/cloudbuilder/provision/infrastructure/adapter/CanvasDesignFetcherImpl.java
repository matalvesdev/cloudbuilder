package com.cloudbuilder.provision.infrastructure.adapter;

import com.cloudbuilder.design.domain.model.Canvas;
import com.cloudbuilder.design.domain.model.CanvasEdge;
import com.cloudbuilder.design.domain.model.CanvasNode;
import com.cloudbuilder.design.domain.model.ComponentDefinition;
import com.cloudbuilder.design.domain.port.CanvasRepository;
import com.cloudbuilder.design.domain.port.ComponentDefinitionRepository;
import com.cloudbuilder.provision.application.dto.CanvasDesign;
import com.cloudbuilder.provision.application.dto.CanvasDesign.DesignEdge;
import com.cloudbuilder.provision.application.dto.CanvasDesign.DesignNode;
import com.cloudbuilder.provision.application.port.CanvasDesignFetcher;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Map;
@Component
public class CanvasDesignFetcherImpl implements CanvasDesignFetcher {

    private final CanvasRepository canvasRepository;
    private final ComponentDefinitionRepository componentDefinitionRepository;
    private final ObjectMapper objectMapper;

    public CanvasDesignFetcherImpl(CanvasRepository canvasRepository,
                                   ComponentDefinitionRepository componentDefinitionRepository,
                                   ObjectMapper objectMapper) {
        this.canvasRepository = canvasRepository;
        this.componentDefinitionRepository = componentDefinitionRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public CanvasDesign fetchCanvasDesign(String canvasId) {
        Canvas canvas = canvasRepository.findById(canvasId)
            .orElseThrow(() -> new IllegalArgumentException("Canvas not found: " + canvasId));

        List<DesignNode> nodes = canvas.getCanvasNodes().stream()
            .map(this::toDesignNode)
            .toList();

        List<DesignEdge> edges = canvas.getCanvasEdges().stream()
            .map(this::toDesignEdge)
            .toList();

        return new CanvasDesign(canvas.getId(), canvas.getName(), nodes, edges);
    }

    private DesignNode toDesignNode(CanvasNode canvasNode) {
        String defId = parseUuid(canvasNode.getComponentDefinitionId());
        ComponentDefinition definition = defId != null
            ? componentDefinitionRepository.findById(defId).orElse(null)
            : null;

        String resourceType = definition != null ? definition.getResourceType() : "unknown";
        String provider = definition != null ? definition.getProvider() : "unknown";
        Map<String, String> properties = parseProperties(canvasNode.getProperties());

        return new DesignNode(
            canvasNode.getId().toString(),
            resourceType,
            provider,
            properties,
            canvasNode.getPositionX(),
            canvasNode.getPositionY()
        );
    }

    private DesignEdge toDesignEdge(CanvasEdge canvasEdge) {
        return new DesignEdge(
            canvasEdge.getId().toString(),
            canvasEdge.getSourceNodeId().toString(),
            canvasEdge.getTargetNodeId().toString(),
            canvasEdge.getEdgeType()
        );
    }

    private static String parseUuid(String value) {
        if (value == null || value.isBlank()) return null;
        return value;
    }

    private Map<String, String> parseProperties(String propertiesJson) {
        if (propertiesJson == null || propertiesJson.isBlank()) {
            return Collections.emptyMap();
        }
        try {
            // Frontend stores nested JSON: {"label":"...","provider":"...","resourceType":"...","properties":{...}}
            // We need to extract the inner "properties" object for template rendering
            Map<String, Object> outer = objectMapper.readValue(propertiesJson, new TypeReference<>() {});
            Object innerProps = outer.get("properties");
            if (innerProps instanceof Map<?, ?> innerMap) {
                // Convert nested properties to flat Map<String, String>
                Map<String, String> result = new java.util.LinkedHashMap<>();
                for (Map.Entry<?, ?> entry : innerMap.entrySet()) {
                    if (entry.getValue() != null) {
                        result.put(String.valueOf(entry.getKey()), String.valueOf(entry.getValue()));
                    }
                }
                return result;
            }
            // Fallback: try to parse as flat map (legacy format)
            return objectMapper.readValue(propertiesJson, new TypeReference<>() {});
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }
}
