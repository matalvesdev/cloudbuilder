package com.cloudbuilder.design.domain.event;

import java.util.UUID;

public record ComponentAddedEvent(UUID canvasId, UUID nodeId, String componentType, String tenantId) {}
