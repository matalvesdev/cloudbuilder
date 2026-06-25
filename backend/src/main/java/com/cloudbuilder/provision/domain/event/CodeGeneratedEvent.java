package com.cloudbuilder.provision.domain.event;

public record CodeGeneratedEvent(String canvasId, String canvasName, String tenantId) {
}
