package com.cloudbuilder.credential.application.dto;

public record TestConnectionResponse(
    boolean success,
    String message
) {}
