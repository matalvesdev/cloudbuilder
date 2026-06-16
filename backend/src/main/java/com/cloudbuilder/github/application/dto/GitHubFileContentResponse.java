package com.cloudbuilder.github.application.dto;

public record GitHubFileContentResponse(
    String name,
    String path,
    String content
) {}
