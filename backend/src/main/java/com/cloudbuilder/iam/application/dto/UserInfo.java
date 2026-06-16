package com.cloudbuilder.iam.application.dto;

import java.util.Set;

public record UserInfo(
    String id,
    String name,
    String email,
    Set<String> roles,
    String status
) {}
