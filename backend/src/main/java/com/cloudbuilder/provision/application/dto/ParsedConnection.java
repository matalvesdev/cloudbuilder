package com.cloudbuilder.provision.application.dto;

public record ParsedConnection(
    String sourceResourceName,
    String targetResourceName
) {}
