package com.cloudbuilder.provision.application.dto;

import java.util.List;

public record ImportTerraformResponse(
    List<ParsedResource> resources,
    List<ParsedConnection> connections,
    List<String> warnings,
    int resourceCount
) {}
