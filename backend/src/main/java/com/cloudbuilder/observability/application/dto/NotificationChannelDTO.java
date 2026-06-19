package com.cloudbuilder.observability.application.dto;

public record NotificationChannelDTO(
    String id,
    String name,
    String type,
    boolean enabled
) {}
