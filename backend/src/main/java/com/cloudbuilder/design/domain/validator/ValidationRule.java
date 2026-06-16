package com.cloudbuilder.design.domain.validator;

import com.cloudbuilder.design.domain.model.Canvas;
import com.cloudbuilder.design.domain.model.CanvasEdge;
import com.cloudbuilder.design.domain.model.CanvasNode;

public interface ValidationRule {
    String getRuleName();
    ValidationResult validate(Canvas canvas, CanvasNode node);
    ValidationResult validate(Canvas canvas, CanvasEdge edge);
}
