package com.cloudbuilder.design.domain.event;

public record CanvasCreatedEvent(String canvasId, String tenantId, String name, String userId) {}
