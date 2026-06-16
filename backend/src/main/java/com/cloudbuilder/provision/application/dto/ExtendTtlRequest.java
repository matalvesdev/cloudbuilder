package com.cloudbuilder.provision.application.dto;

import jakarta.validation.constraints.Positive;

public record ExtendTtlRequest(
    @Positive int extraHours
) {}
