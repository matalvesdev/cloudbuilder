package com.cloudbuilder.tenant.application.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateMemberRoleRequest(
    @NotBlank String role
) {}
