package com.cloudbuilder.design.domain.port;

import com.cloudbuilder.design.domain.model.Canvas;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
public interface CanvasRepository extends JpaRepository<Canvas, String> {
    List<Canvas> findByTenantIdOrderByUpdatedAtDesc(String tenantId);
}
