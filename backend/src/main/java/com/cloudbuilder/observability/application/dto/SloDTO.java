package com.cloudbuilder.observability.application.dto;

public record SloDTO(
    String id,
    String name,
    String sliType,
    double targetPct,
    double currentSliPct,
    double errorBudgetPct,
    String status
) {}
