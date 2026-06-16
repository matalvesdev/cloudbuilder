package com.cloudbuilder.design.domain.validator;

import com.cloudbuilder.design.domain.model.Canvas;
import com.cloudbuilder.design.domain.model.CanvasEdge;
import com.cloudbuilder.design.domain.model.CanvasNode;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class RequiredPropertiesRule implements ValidationRule {

    private static final Map<String, Set<String>> REQUIRED_PROPERTIES = Map.of(
            "aws_instance", Set.of("instance_type", "ami"),
            "aws_db_instance", Set.of("engine", "instance_class"),
            "aws_s3_bucket", Set.of("bucket"),
            "aws_lb", Set.of("name", "internal")
    );

    private final ObjectMapper objectMapper;

    public RequiredPropertiesRule(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public String getRuleName() {
        return "requiredProperties";
    }

    @Override
    public ValidationResult validate(Canvas canvas, CanvasNode node) {
        String resourceType = node.getComponentDefinitionId();
        Set<String> required = REQUIRED_PROPERTIES.get(resourceType);
        if (required == null) {
            return valid(node.getId().toString());
        }

        Map<String, Object> props = parseProperties(node.getProperties());
        if (props == null) {
            return new ValidationResult(getRuleName(), false, ValidationResult.Severity.WARNING,
                    "Could not parse properties for " + resourceType, node.getId().toString());
        }

        List<String> missing = required.stream()
                .filter(key -> props.get(key) == null || props.get(key).toString().isBlank())
                .toList();

        if (!missing.isEmpty()) {
            return new ValidationResult(getRuleName(), false, ValidationResult.Severity.WARNING,
                    resourceType + " is missing required properties: " + String.join(", ", missing),
                    node.getId().toString());
        }

        return valid(node.getId().toString());
    }

    @Override
    public ValidationResult validate(Canvas canvas, CanvasEdge edge) {
        return valid(edge.getId().toString());
    }

    private ValidationResult valid(String componentId) {
        return new ValidationResult(getRuleName(), true, ValidationResult.Severity.INFO,
                "Required properties check passed", componentId);
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
