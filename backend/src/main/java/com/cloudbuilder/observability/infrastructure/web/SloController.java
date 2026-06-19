package com.cloudbuilder.observability.infrastructure.web;

import com.cloudbuilder.observability.application.dto.SloDTO;
import com.cloudbuilder.observability.domain.service.SloService;
import com.cloudbuilder.shared.security.TenantContext;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/observability/slo")
@PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'VIEWER')")
public class SloController {

    private final SloService sloService;

    public SloController(SloService sloService) {
        this.sloService = sloService;
    }

    @GetMapping
    public List<SloDTO> getSloStatus() {
        String tenantId = TenantContext.getTenantId();
        return sloService.getSloStatus(tenantId);
    }
}
