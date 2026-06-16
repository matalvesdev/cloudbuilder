package com.cloudbuilder.provision.application.port;

import com.cloudbuilder.provision.application.dto.CanvasDesign;

import java.util.UUID;

public interface CanvasDesignFetcher {
    CanvasDesign fetchCanvasDesign(UUID canvasId);
}
