package com.cloudbuilder.design.domain.port;

import com.cloudbuilder.design.domain.model.CanvasVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CanvasVersionRepository extends JpaRepository<CanvasVersion, UUID> {

    List<CanvasVersion> findByCanvasIdOrderByVersionDesc(UUID canvasId);

    Optional<CanvasVersion> findByCanvasIdAndVersion(UUID canvasId, int version);

    Optional<CanvasVersion> findTopByCanvasIdOrderByVersionDesc(UUID canvasId);
}
