package com.cloudbuilder.design.domain.port;

import com.cloudbuilder.design.domain.model.Canvas;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CanvasRepository extends JpaRepository<Canvas, UUID> {
    List<Canvas> findByTenantIdOrderByUpdatedAtDesc(String tenantId);
}
