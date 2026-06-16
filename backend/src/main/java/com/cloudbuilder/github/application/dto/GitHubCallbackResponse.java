package com.cloudbuilder.github.application.dto;

public record GitHubCallbackResponse(
    String token,
    String message
) {}
