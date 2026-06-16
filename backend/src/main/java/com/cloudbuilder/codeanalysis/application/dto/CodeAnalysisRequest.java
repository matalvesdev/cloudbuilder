package com.cloudbuilder.codeanalysis.application.dto;

import java.util.List;

public record CodeAnalysisRequest(
    List<SourceFile> files,
    String repoUrl
) {
    public record SourceFile(
        String fileName,
        String path,
        String content
    ) {}
}
