package com.cloudbuilder.iam.application.dto;

public record RegisterRequest(String email, String password, String name, String tenantName, String tenantSlug) {}
