package com.cloudbuilder.design.domain.validator;

import com.cloudbuilder.design.domain.model.Canvas;
import com.cloudbuilder.design.domain.model.CanvasEdge;
import com.cloudbuilder.design.domain.model.CanvasNode;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Component
public class ConnectionCompatibilityRule implements ValidationRule {

    private static final Map<String, Set<String>> ALLOWED_CONNECTIONS = Map.of(
            "aws_subnet", Set.of("aws_instance"),
            "aws_security_group", Set.of("aws_instance"),
            "aws_lb", Set.of("aws_lb_target_group"),
            "aws_internet_gateway", Set.of("aws_vpc")
    );

    @Override
    public String getRuleName() {
        return "connectionCompatibility";
    }

    @Override
    public ValidationResult validate(Canvas canvas, CanvasNode node) {
        return valid(node.getId().toString());
    }

    @Override
    public ValidationResult validate(Canvas canvas, CanvasEdge edge) {
        if (edge.getSourceNodeId().equals(edge.getTargetNodeId())) {
            return new ValidationResult(getRuleName(), false, ValidationResult.Severity.ERROR,
                    "Self-connections are not allowed", edge.getId().toString());
        }

        Optional<CanvasNode> sourceOpt = findNode(canvas, edge.getSourceNodeId());
        Optional<CanvasNode> targetOpt = findNode(canvas, edge.getTargetNodeId());

        if (sourceOpt.isEmpty() || targetOpt.isEmpty()) {
            return new ValidationResult(getRuleName(), false, ValidationResult.Severity.WARNING,
                    "Could not resolve source or target node for edge", edge.getId().toString());
        }

        String sourceType = sourceOpt.get().getComponentDefinitionId();
        String targetType = targetOpt.get().getComponentDefinitionId();

        Set<String> allowedTargets = ALLOWED_CONNECTIONS.get(sourceType);
        if (allowedTargets != null && allowedTargets.contains(targetType)) {
            return valid(edge.getId().toString());
        }

        return new ValidationResult(getRuleName(), false, ValidationResult.Severity.WARNING,
                "Unusual connection type: " + sourceType + " -> " + targetType,
                edge.getId().toString());
    }

    private Optional<CanvasNode> findNode(Canvas canvas, java.util.UUID nodeId) {
        return canvas.getCanvasNodes().stream()
                .filter(n -> n.getId().equals(nodeId))
                .findFirst();
    }

    private ValidationResult valid(String componentId) {
        return new ValidationResult(getRuleName(), true, ValidationResult.Severity.INFO,
                "Connection is compatible", componentId);
    }
}
