package com.cloudbuilder.design.domain.port;

import com.cloudbuilder.design.domain.model.Canvas;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
public interface CanvasRepository extends JpaRepository<Canvas, String> {
    List<Canvas> findByTenantIdOrderByUpdatedAtDesc(String tenantId);
    Page<Canvas> findByTenantId(String tenantId, Pageable pageable);
}
