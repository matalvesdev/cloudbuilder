package com.cloudbuilder.design.domain.port;

import com.cloudbuilder.design.domain.model.CanvasVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
public interface CanvasVersionRepository extends JpaRepository<CanvasVersion, String> {

    List<CanvasVersion> findByCanvasIdOrderByVersionDesc(String canvasId);

    Optional<CanvasVersion> findByCanvasIdAndVersion(String canvasId, int version);

    Optional<CanvasVersion> findTopByCanvasIdOrderByVersionDesc(String canvasId);
}
