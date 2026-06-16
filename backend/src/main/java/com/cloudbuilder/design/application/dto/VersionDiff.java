package com.cloudbuilder.design.application.dto;

import java.util.List;
import java.util.UUID;

public record VersionDiff(
        UUID canvasId,
        int versionA,
        int versionB,
        List<DiffEntry> nodesAdded,
        List<DiffEntry> nodesRemoved,
        List<DiffEntry> nodesModified,
        List<DiffEntry> edgesAdded,
        List<DiffEntry> edgesRemoved
) {
    public record DiffEntry(
            String componentId,
            String componentName,
            String changeType,
            String details
    ) {}
}
