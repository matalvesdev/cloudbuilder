package com.cloudbuilder.github.application.dto;

public record GitHubAuthResponse(
    String authorizeUrl,
    boolean configured
) {}
