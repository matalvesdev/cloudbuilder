package com.cloudbuilder.design.infrastructure.web;

import com.cloudbuilder.design.domain.model.Comment;
import com.cloudbuilder.design.domain.service.CommentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/canvases/{canvasId}/comments")
@PreAuthorize("isAuthenticated()")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping
    public ResponseEntity<List<Comment>> getComments(@PathVariable String canvasId) {
        return ResponseEntity.ok(commentService.getComments(canvasId));
    }

    @GetMapping("/node/{nodeId}")
    public ResponseEntity<List<Comment>> getNodeComments(
            @PathVariable String canvasId, @PathVariable String nodeId) {
        return ResponseEntity.ok(commentService.getNodeComments(canvasId, nodeId));
    }

    @GetMapping("/open")
    public ResponseEntity<List<Comment>> getOpenComments(@PathVariable String canvasId) {
        return ResponseEntity.ok(commentService.getOpenComments(canvasId));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<Comment> addComment(
            @PathVariable String canvasId,
            @RequestBody Map<String, String> request) {
        String nodeId = request.get("nodeId");
        String content = request.get("content");
        String authorId = request.getOrDefault("authorId", "anonymous");
        String authorName = request.getOrDefault("authorName", "Anonymous");
        String tenantId = request.getOrDefault("tenantId", "default");
        String mentionIds = request.get("mentionIds");

        Comment comment = commentService.addComment(canvasId, nodeId, tenantId, authorId, authorName, content, mentionIds);
        return ResponseEntity.ok(comment);
    }

    @PostMapping("/{commentId}/resolve")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<Comment> resolve(
            @PathVariable String canvasId, @PathVariable String commentId) {
        Comment resolved = commentService.resolve(commentId, "current-user");
        return ResponseEntity.ok(resolved);
    }

    @PostMapping("/{commentId}/reopen")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EDITOR')")
    public ResponseEntity<Comment> reopen(
            @PathVariable String canvasId, @PathVariable String commentId) {
        Comment reopened = commentService.reopen(commentId);
        return ResponseEntity.ok(reopened);
    }

    @DeleteMapping("/{commentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String canvasId, @PathVariable String commentId) {
        commentService.delete(commentId);
        return ResponseEntity.noContent().build();
    }
}
