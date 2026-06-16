package com.cloudbuilder.provision.application.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record ImportMultiRequest(
    @NotEmpty List<MultiFileEntry> files
) {
    public record MultiFileEntry(
        String fileName,
        String content
    ) {}
}
