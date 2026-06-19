package com.cloudbuilder.provision.application.port;

import com.cloudbuilder.provision.application.dto.CanvasDesign;

public interface CanvasDesignFetcher {
    CanvasDesign fetchCanvasDesign(String canvasId);
}
