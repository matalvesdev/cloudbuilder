package com.cloudbuilder.design.domain.port;

import com.cloudbuilder.design.domain.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, String> {
    List<Comment> findByCanvasIdOrderByCreatedAtDesc(String canvasId);
    List<Comment> findByCanvasIdAndNodeIdOrderByCreatedAtDesc(String canvasId, String nodeId);
    List<Comment> findByCanvasIdAndResolvedFalseOrderByCreatedAtDesc(String canvasId);
    long countByCanvasIdAndResolvedFalse(String canvasId);
    long countByCanvasId(String canvasId);
    void deleteByCanvasId(String canvasId);
}
