package com.cloudbuilder.design.domain.service;

import com.cloudbuilder.design.domain.model.Comment;
import com.cloudbuilder.design.domain.port.CommentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CommentService {

    private final CommentRepository commentRepository;

    public CommentService(CommentRepository commentRepository) {
        this.commentRepository = commentRepository;
    }

    public Comment addComment(String canvasId, String nodeId, String tenantId,
                               String authorId, String authorName, String content, String mentionIds) {
        Comment comment = new Comment(canvasId, nodeId, tenantId, authorId, authorName, content);
        if (mentionIds != null) comment.setMentionIds(mentionIds);
        return commentRepository.save(comment);
    }

    @Transactional(readOnly = true)
    public List<Comment> getComments(String canvasId) {
        return commentRepository.findByCanvasIdOrderByCreatedAtDesc(canvasId);
    }

    @Transactional(readOnly = true)
    public List<Comment> getNodeComments(String canvasId, String nodeId) {
        return commentRepository.findByCanvasIdAndNodeIdOrderByCreatedAtDesc(canvasId, nodeId);
    }

    @Transactional(readOnly = true)
    public List<Comment> getOpenComments(String canvasId) {
        return commentRepository.findByCanvasIdAndResolvedFalseOrderByCreatedAtDesc(canvasId);
    }

    public Comment resolve(String commentId, String userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found: " + commentId));
        comment.resolve(userId);
        return commentRepository.save(comment);
    }

    public Comment reopen(String commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found: " + commentId));
        comment.reopen();
        return commentRepository.save(comment);
    }

    public void delete(String commentId) {
        commentRepository.deleteById(commentId);
    }

    @Transactional(readOnly = true)
    public long countOpen(String canvasId) {
        return commentRepository.countByCanvasIdAndResolvedFalse(canvasId);
    }
}
