package com.cloudbuilder.design.domain.event;

import java.util.UUID;

public record CanvasCreatedEvent(UUID canvasId, String tenantId, String name, String userId) {}
