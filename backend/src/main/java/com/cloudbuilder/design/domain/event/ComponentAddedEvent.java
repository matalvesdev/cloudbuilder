package com.cloudbuilder.design.domain.event;

public record ComponentAddedEvent(String canvasId, String nodeId, String componentType, String tenantId) {}
