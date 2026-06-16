package com.cloudbuilder.github.application.dto;

import java.util.List;

public record GitHubRepoListResponse(
    List<RepoItem> repos
) {
    public record RepoItem(
        long id,
        String fullName,
        String name,
        String owner,
        String description,
        String defaultBranch,
        String language,
        boolean isPrivate,
        String updatedAt,
        String htmlUrl
    ) {}
}
