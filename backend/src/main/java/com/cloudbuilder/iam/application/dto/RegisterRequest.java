package com.cloudbuilder.iam.application.dto;

import jakarta.validation.constraints.*;

public record RegisterRequest(
    @NotBlank(message = "Nome é obrigatório")
    @Size(min = 2, max = 100, message = "Nome deve ter entre 2 e 100 caracteres")
    String name,

    @NotBlank(message = "E-mail é obrigatório")
    @Email(message = "E-mail inválido")
    @Size(max = 255, message = "E-mail muito longo")
    String email,

    @NotBlank(message = "Senha é obrigatória")
    @Size(min = 8, max = 128, message = "Senha deve ter entre 8 e 128 caracteres")
    String password,

    @Size(max = 100, message = "Nome da organização muito longo")
    String tenantName,

    @Size(max = 50, message = "Slug muito longo")
    @Pattern(regexp = "^[a-z0-9]([a-z0-9\\-]*[a-z0-9])?$", message = "Slug deve conter apenas letras minúsculas, números e hífens")
    String tenantSlug,

    @Pattern(regexp = "^(admin|editor|viewer)$", message = "Patente deve ser admin, editor ou viewer")
    String role
) {}
