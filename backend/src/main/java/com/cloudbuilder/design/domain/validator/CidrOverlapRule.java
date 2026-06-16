package com.cloudbuilder.design.domain.validator;

import com.cloudbuilder.design.domain.model.Canvas;
import com.cloudbuilder.design.domain.model.CanvasEdge;
import com.cloudbuilder.design.domain.model.CanvasNode;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;

@Component
public class CidrOverlapRule implements ValidationRule {

    private final ObjectMapper objectMapper;

    public CidrOverlapRule(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public String getRuleName() {
        return "cidrOverlap";
    }

    @Override
    public ValidationResult validate(Canvas canvas, CanvasNode node) {
        return valid(node.getId().toString());
    }

    @Override
    public ValidationResult validate(Canvas canvas, CanvasEdge edge) {
        Optional<CanvasNode> sourceOpt = findNode(canvas, edge.getSourceNodeId());
        Optional<CanvasNode> targetOpt = findNode(canvas, edge.getTargetNodeId());

        if (sourceOpt.isEmpty() || targetOpt.isEmpty()) {
            return valid(edge.getId().toString());
        }

        CanvasNode source = sourceOpt.get();
        CanvasNode target = targetOpt.get();

        if (!"aws_subnet".equals(source.getComponentDefinitionId())
                || !"aws_subnet".equals(target.getComponentDefinitionId())) {
            return valid(edge.getId().toString());
        }

        Map<String, Object> sourceProps = parseProperties(source.getProperties());
        Map<String, Object> targetProps = parseProperties(target.getProperties());

        if (sourceProps == null || targetProps == null) {
            return new ValidationResult(getRuleName(), false, ValidationResult.Severity.WARNING,
                    "Could not parse properties for CIDR overlap check",
                    edge.getId().toString());
        }

        String sourceCidr = getCidrBlock(sourceProps);
        String targetCidr = getCidrBlock(targetProps);

        if (sourceCidr == null || targetCidr == null) {
            return new ValidationResult(getRuleName(), false, ValidationResult.Severity.WARNING,
                    "CIDR block not defined on subnet(s)",
                    edge.getId().toString());
        }

        return valid(edge.getId().toString());
    }

    private String getCidrBlock(Map<String, Object> props) {
        Object cidr = props.get("cidr_block");
        if (cidr == null) {
            return null;
        }
        String val = cidr.toString().trim();
        return val.isEmpty() ? null : val;
    }

    private Optional<CanvasNode> findNode(Canvas canvas, java.util.UUID nodeId) {
        return canvas.getCanvasNodes().stream()
                .filter(n -> n.getId().equals(nodeId))
                .findFirst();
    }

    private ValidationResult valid(String componentId) {
        return new ValidationResult(getRuleName(), true, ValidationResult.Severity.INFO,
                "CIDR overlap check passed", componentId);
    }

    private Map<String, Object> parseProperties(String propertiesJson) {
        if (propertiesJson == null || propertiesJson.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(propertiesJson, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return null;
        }
    }
}
