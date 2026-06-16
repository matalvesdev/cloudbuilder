package com.cloudbuilder.github.application.dto;

import java.util.List;

public record GitHubFileListResponse(
    List<FileItem> files
) {
    public record FileItem(
        String name,
        String path,
        String type,
        String sha,
        long size
    ) {}
}
